const CONSTANTS = {
  CHECK_INTERVAL: 500,
  INITIAL_DELAY: 500,
  MAX_RETRIES: 10,
  CACHE_DURATION: 5 * 60 * 1000,
  FAILED_CACHE_DURATION: 30 * 1000,
  SECONDS_PER_DAY: 86400,
  DEFAULT_SPAMMER_HOURS: 12,
  MIN_POSTS_FOR_SPAM_CHECK: 10,
  RECHECK_INTERVAL: 2000,
  MIN_POSTS_FOR_SELECTOR_CHECK: 5,
};

let settings = {};
const userDataCache = new Map();
const pendingRequests = new Map();
const processedPosts = new WeakSet();

// Promise to track when settings are loaded
const settingsLoaded = new Promise((resolve) => {
  chrome.storage.local.get(settingsKeys, (data) => {
    settings = Object.assign({}, data);
    applyPageClasses();
    resolve();
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  for (const [key, { newValue }] of Object.entries(changes)) {
    settings[key] = newValue;
  }
  applyPageClasses();
});

// Pure-CSS options are switched with a data attribute on <html>, so they apply
// to posts already on the page and take effect the moment the popup toggle
// changes. Not a class: 9gag assigns <html>'s className when it applies the
// theme ("html-dark"), which wipes any class set before that.
function applyPageClasses() {
  const root = document.documentElement;
  root.toggleAttribute("data-pf-wide-media", !!settings.wide_media);
  root.toggleAttribute("data-pf-hide-cheers", !!settings.cheers);
  root.toggleAttribute("data-pf-hide-meme", !!settings.hide_meme);
}

// 9gag is an SPA: clicking into a post's comments or a user profile changes
// the URL without reloading the content script, so watchers set up on the
// feed keep running there too unless they re-check the URL every time.
function shouldFilter() {
  return isValidFilterUrl("/u/", "/gag/");
}

window.addEventListener("popstate", () => {
  if (!shouldFilter()) return;

  // Snapshot the scroll position the browser/site just restored, since our
  // async filtering (network calls per post) can shrink the page afterwards
  // and silently drag the viewport away from where the user actually was.
  const targetScrollY = window.scrollY;
  const unprocessedPosts = $("article:not(.filtered):not(.filtering)");
  if (unprocessedPosts.length) {
    filter(unprocessedPosts).then(() => {
      if (window.scrollY !== targetScrollY) {
        window.scrollTo(0, targetScrollY);
      }
    });
  }
});

// Check if jQuery/Cash.js is available
if (typeof $ === 'undefined') {
  console.error('9gag Post Filter: jQuery/Cash.js is not loaded. Extension cannot function.');
  throw new Error('Required library $ is not available');
}

// Main initialization - wait for settings to load.
//
// 9gag now ships an empty shell (<div id="jsid-app"> plus a spinner) and
// renders the whole feed client-side, so there is no #container / #list-view-2
// to hook at load time and their names keep changing between layout
// experiments. Watch the whole body for <article> posts instead, which is the
// one thing that has stayed stable.
(async function initExtension() {
  await settingsLoaded;

  createAddObserver(
    document.body,
    (addedNode) => {
      if (addedNode.nodeType !== Node.ELEMENT_NODE || !shouldFilter()) return;
      if (addedNode.matches("article") || addedNode.querySelector("article")) {
        filter(addedNode);
      } else if (addedNode.closest("article")) {
        // Content filled into an existing (previously empty) article.
        filter(addedNode.closest("article"));
      }
    },
    { childList: true, subtree: true },
  );

  if (shouldFilter()) {
    filter(document.body);
  }

  // Safety net for posts whose <article> was inserted empty and filled in
  // later, or that the observer otherwise missed.
  setInterval(() => {
    if (document.visibilityState !== "visible" || !shouldFilter()) {
      return;
    }

    checkSelectorHealth();

    const unprocessedPosts = $("article:not(.filtered):not(.filtering)");
    if (unprocessedPosts.length > 0) {
      filter(unprocessedPosts);
    }
  }, CONSTANTS.RECHECK_INTERVAL);
})();

// 9gag changes its markup every few months and the extension then fails
// silently: labels go nowhere, votes aren't found. Once a few posts have been
// processed, warn (once per selector per page load) about any required
// selector that none of them match, so the next breakage names its own cause.
const warnedSelectors = new Set();

function warnSelectorOnce(key, message) {
  if (warnedSelectors.has(key)) return;
  warnedSelectors.add(key);
  console.warn(`9gag Post Filter: ${message} 9gag has probably changed its layout; update assets/js/selectors.js.`);
}

function checkSelectorHealth() {
  const articles = document.querySelectorAll("article");
  if (!articles.length) {
    // Posts are still there, just no longer rendered as <article>.
    if (document.querySelectorAll("a[href*='/gag/']").length >= CONSTANTS.MIN_POSTS_FOR_SELECTOR_CHECK) {
      warnSelectorOnce("article", "the page has post links but no <article> elements.");
    }
    return;
  }

  const renderedPosts = Array.from(articles).filter(
    (article) => article.classList.contains("filtered") && article.querySelector(SELECTORS.header),
  );
  if (renderedPosts.length < CONSTANTS.MIN_POSTS_FOR_SELECTOR_CHECK) return;

  for (const [key, selector] of Object.entries(REQUIRED_SELECTORS)) {
    if (!renderedPosts.some((post) => post.querySelector(selector))) {
      warnSelectorOnce(key, `SELECTORS.${key} ("${selector}") matched 0 of ${renderedPosts.length} posts.`);
    }
  }
}

// Periodic cache cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [username, cached] of userDataCache.entries()) {
    if (now >= cached.expires) {
      userDataCache.delete(username);
    }
  }
}, CONSTANTS.CACHE_DURATION); // Run cleanup every 5 minutes

// Returns the cache entry ({ data }) or undefined. A failed lookup is cached
// too, with data === null and a short lifetime, so a user whose request fails
// (rate limit, deleted account) isn't re-requested for every one of their
// posts on the page.
function getCachedUserData(username) {
  const cached = userDataCache.get(username);
  return cached && Date.now() < cached.expires ? cached : undefined;
}

function setCachedUserData(username, data) {
  userDataCache.set(username, {
    data,
    expires: Date.now() + (data ? CONSTANTS.CACHE_DURATION : CONSTANTS.FAILED_CACHE_DURATION),
  });
}

async function fetchUserData(username) {
  try {
    const cached = getCachedUserData(username);
    if (cached) {
      return cached.data;
    }

    if (pendingRequests.has(username)) {
      return await pendingRequests.get(username);
    }

    const requestPromise = fetch(`https://9gag.com/v1/user-posts/username/${encodeURIComponent(username)}/type/posts`, {
      headers: { accept: "*/*" },
      // 9GAG's user-posts endpoint only accepts POST requests (it rejects GET).
      // No request body is needed — the username is passed in the URL path.
      method: "POST",
      mode: "cors",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        setCachedUserData(username, json);
        pendingRequests.delete(username);
        return json;
      })
      .catch((error) => {
        setCachedUserData(username, null);
        pendingRequests.delete(username);
        console.error(`Failed to fetch user data for ${username}:`, error);
        return null;
      });

    pendingRequests.set(username, requestPromise);
    return await requestPromise;
  } catch (error) {
    console.error(`Error in fetchUserData for ${username}:`, error);
    return null;
  }
}

function addVideoControls(post) {
  if (!settings.show_controls) return;

  const video = post.find(SELECTORS.video).first();
  if (video.length) {
    video.attr("controls", "controls");
  }
}

// Appends our labels next to the post's author/time line, in the first of
// SELECTORS.postMetaTargets the post has.
function appendToPostMeta(post, html) {
  for (const selector of SELECTORS.postMetaTargets) {
    const target = post.find(selector).first();
    if (target.length) {
      target.append(html);
      return;
    }
  }
}

async function addUsername(post) {
  try {
    const name = await getNameFromMenu(post[0]);
    if (!name) return null;

    // Skip when the header already shows the author (user posts link the
    // byline name to their profile; interest posts show the interest instead).
    const authorShown = post.find(SELECTORS.authorShown).length;
    if (!authorShown) {
      // Sanitize username to prevent XSS
      const sanitizedName = document.createElement('div');
      sanitizedName.textContent = name;
      const safeName = sanitizedName.innerHTML;

      appendToPostMeta(post, `<span>| <a class="user-link" href="https://9gag.com/u/${encodeURIComponent(name)}">@${safeName}</a></span>`);
    }

    return name;
  } catch (error) {
    console.error("Error adding username:", error);
    return null;
  }
}

// Matches emoji: everything that renders as an emoji by default, the symbol /
// dingbat / pictograph blocks, and the emoji variation selector (U+FE0F), which
// turns text symbols such as "❤" into emoji. Only U+FE0F is matched from its
// block: the rest of U+FE00-FEFF is Arabic and CJK presentation forms, so the
// whole range hid every post with an Arabic title.
const EMOJI_REGEX = /\p{Emoji_Presentation}|[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

function filterByEmojiTitle(post) {
  if (!settings.hide_emoji_title) return false;

  const titleEl = post.find(SELECTORS.title).first();
  if (!titleEl.length) return false;

  const title = titleEl.text();
  if (EMOJI_REGEX.test(title)) {
    collapsePost(post, "emoji in title");
    return true;
  }
  return false;
}

function calculateAccountAge(creationTs) {
  const now = Date.now() / 1000;
  const diff = now - creationTs;
  return Math.floor(diff / CONSTANTS.SECONDS_PER_DAY);
}

function addAccountAge(post, days) {
  if (!settings.show_days) return;

  appendToPostMeta(post, `<span>| ${days} days </span>`);
}

// Puts a one-line "Hidden: <reason> · <title> · Show" bar at the top of a
// collapsed post (content.css hides everything else in it). The bar lives
// inside the <article> rather than next to it so it doesn't add nodes to the
// list Vue manages, and is dropped together with the post if Vue replaces it.
function addHiddenBar(post, reason) {
  if (post.children(".hidden-bar").length) return;

  const bar = document.createElement("div");
  bar.className = "hidden-bar";

  const reasonEl = document.createElement("span");
  reasonEl.className = "hidden-bar__reason";
  reasonEl.textContent = `Hidden: ${reason}`;

  const titleEl = document.createElement("span");
  titleEl.className = "hidden-bar__title";
  titleEl.textContent = post.find(SELECTORS.title).first().text();

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "hidden-bar__toggle";
  toggle.textContent = "Show";
  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const revealed = post[0].classList.toggle("revealed");
    toggle.textContent = revealed ? "Hide" : "Show";
  });

  bar.append(reasonEl, titleEl, toggle);
  post[0].prepend(bar);
}

// Collapses a filtered post without letting the page jump under the user: if
// the post already scrolled past (above the viewport), we shrink scrollY by the
// same amount we just removed so content on screen doesn't move.
//
// Hiding is done purely with classes (see content.css). 9gag owns this DOM via
// Vue, so removing the <article> or writing inline styles is fragile: Vue can
// re-render the list at any time (infinite scroll, archiving streams that
// scroll far away and restoring them later), and it re-applies the inline
// min-height it uses to reserve each stream's space. The <article> itself has
// no class binding, so classes we add survive those re-renders.
function collapsePost(post, reason) {
  const isAboveViewport = post[0].getBoundingClientRect().bottom < 0;
  const heightBefore = isAboveViewport ? post.outerHeight(true) : 0;

  if (settings.remove_hidden) {
    post.addClass("removed");
  } else {
    addHiddenBar(post, reason);
  }
  post.addClass("hidden filtered");

  if (isAboveViewport) {
    const heightAfter = settings.remove_hidden ? 0 : post.outerHeight(true);
    if (heightBefore > heightAfter) {
      window.scrollBy(0, heightAfter - heightBefore);
    }
  }
}

// Popup number inputs are stored as strings, and older versions saved "" when
// the box was cleared. Returns null for anything that isn't a positive number
// so callers fall back to their default instead of comparing against "" (== 0).
function parsePositiveNumber(value) {
  const number = parseFloat(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function filterByMinDays(post, days) {
  const minDays = parsePositiveNumber(settings.min_days);
  if (minDays !== null && minDays > days) {
    collapsePost(post, `account ${days} days old`);
    return true;
  }
  return false;
}

function calculateSpamScore(posts) {
  if (posts.length < CONSTANTS.MIN_POSTS_FOR_SPAM_CHECK) {
    return null;
  }

  // Average gap between consecutive posts = time from oldest to newest divided
  // by the number of gaps. Time since the last post is deliberately left out
  // (it would skew the average for users who simply haven't posted recently),
  // and using min/max keeps it correct when the API doesn't return the posts
  // newest-first (pinned posts).
  const timestamps = posts.map((p) => Number(p.creationTs)).filter(Number.isFinite);
  if (timestamps.length < CONSTANTS.MIN_POSTS_FOR_SPAM_CHECK) return null;

  const spanHours = (Math.max(...timestamps) - Math.min(...timestamps)) / 3600;
  return spanHours / (timestamps.length - 1);
}

function handleSpammer(post, avgHoursBetweenPosts) {
  const threshold = parsePositiveNumber(settings.spammers_hours) ?? CONSTANTS.DEFAULT_SPAMMER_HOURS;

  if (avgHoursBetweenPosts < threshold) {
    if (settings.hide_spammers) {
      collapsePost(post, `spammer (a post every ${avgHoursBetweenPosts.toFixed(1)}h)`);
      return true;
    } else {
      appendToPostMeta(post, `<span class="spammer-label">| SPAMMER</span>`);
    }
  }
  return false;
}

function getPostId(post) {
  try {
    const link = post.find(SELECTORS.postLink).first();
    if (!link.length) return null;

    const match = link.attr("href").match(/\/gag\/([^\/?#]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error getting post ID:", error);
    return null;
  }
}

function findPostVotes(posts, postId) {
  const post = posts.find((p) => p.id === postId);
  return post ? { downvotes: post.downVoteCount, upvotes: post.upVoteCount } : { downvotes: null, upvotes: null };
}

function addVoteCounts(post, downvotes, upvotes) {
  if (downvotes === null || upvotes === null) return false;

  if (settings.more_downvotes && downvotes > upvotes) {
    collapsePost(post, `${downvotes} downvotes vs ${upvotes} upvotes`);
    return true;
  }

  const upvoteElement = post.find(SELECTORS.upvoteCount).first();
  // The upvote count is hidden behind a "•" bullet when the site decides not to
  // show it. Use a trimmed comparison so minor whitespace differences don't
  // silently break the feature.
  if (settings.always_display_upvotes && upvoteElement.length && upvoteElement.html().trim() === "•") {
    upvoteElement.html(upvotes);
  }

  // Sanitize vote counts (should be numbers, but be safe)
  const safeDownvotes = parseInt(downvotes, 10) || 0;
  const downvoteSpan = `<span class="post-vote__text downvote upvote">${safeDownvotes}</span>`;
  post.find(SELECTORS.legacyVoteContainer).append(downvoteSpan);
  post.find(SELECTORS.downvoteButton).after(`<span class="post-vote__text downvote">${safeDownvotes}</span>`);

  return false;
}

async function processPost(post) {
  const postElement = post[0];

  if (processedPosts.has(postElement)) {
    return;
  }

  // Streams far from the viewport are rendered as empty <article> shells and
  // filled in later. Leave them untouched so the recheck picks them up once
  // they have content, instead of marking them done while empty.
  if (!post.find(SELECTORS.header).length) {
    return;
  }

  try {
    post.addClass("filtering");
    processedPosts.add(postElement);

    addVideoControls(post);

    if (filterByEmojiTitle(post)) return;

    if (!shouldFilter()) {
      // Navigated away (e.g. into comments) before this post's turn came up.
      post.addClass("filtered");
      return;
    }

    const username = await addUsername(post);
    if (!username) {
      post.addClass("filtered");
      return;
    }

    if (!shouldFilter()) {
      // Navigated away while the username lookup was in flight.
      post.addClass("filtered");
      return;
    }

    if (settings.show_days || parsePositiveNumber(settings.min_days) !== null || settings.spammers || settings.hide_spammers || settings.more_downvotes || settings.always_display_upvotes) {
      const userData = await fetchUserData(username);
      if (!userData || !userData.data) {
        post.addClass("filtered");
        return;
      }

      if (!shouldFilter()) {
        // Navigated away while the user-data fetch was in flight — this is
        // the common case, since that network round trip is the slowest step.
        post.addClass("filtered");
        return;
      }

      const profile = userData.data.profile;
      const posts = userData.data.posts;

      if (!profile || !posts) {
        post.addClass("filtered");
        return;
      }

      const accountAge = calculateAccountAge(profile.creationTs);

      if (filterByMinDays(post, accountAge)) {
        return;
      }

      addAccountAge(post, accountAge);

      if (settings.spammers || settings.hide_spammers) {
        const avgHours = calculateSpamScore(posts);
        if (avgHours !== null) {
          const wasRemoved = handleSpammer(post, avgHours);
          if (wasRemoved) return;
        }
      }

      const postId = getPostId(post);
      if (postId) {
        const { downvotes, upvotes } = findPostVotes(posts, postId);
        const wasHidden = addVoteCounts(post, downvotes, upvotes);
        if (wasHidden) return;
      }
    }

    post.addClass("filtered");
  } catch (error) {
    console.error("Error processing post:", error);
    post.addClass("filtered");
  }
}

async function filter(addedNode) {
  try {
    // Full-document catch-up for anything this call misses is handled by the
    // recheckInterval safety net, so we only need to look inside addedNode here.
    const unprocessed = "article:not(.filtered):not(.filtering)";
    const posts = $(addedNode).find(unprocessed).add($(addedNode).filter(unprocessed));

    if (!posts.length) {
      return;
    }

    const BATCH_SIZE = 5;
    const postsArray = posts.get();

    for (let i = 0; i < postsArray.length; i += BATCH_SIZE) {
      if (!shouldFilter()) break;
      const batch = postsArray.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((element) => processPost($(element))));
    }
  } catch (error) {
    console.error("Error in filter function:", error);
  }
}
