const CONSTANTS = {
  CHECK_INTERVAL: 500,
  INITIAL_DELAY: 500,
  MAX_RETRIES: 10,
  CACHE_DURATION: 5 * 60 * 1000,
  SECONDS_PER_DAY: 86400,
  DEFAULT_SPAMMER_HOURS: 12,
  MIN_POSTS_FOR_SPAM_CHECK: 10,
  RECHECK_INTERVAL: 2000,
};

let settings = {};
const userDataCache = new Map();
const pendingRequests = new Map();
const processedPosts = new WeakSet();
let activeIntervals = [];

// Promise to track when settings are loaded
const settingsLoaded = new Promise((resolve) => {
  chrome.storage.local.get(settingsKeys, (data) => {
    settings = Object.assign({}, data);
    resolve();
  });
});

chrome.storage.onChanged.addListener((changes) => {
  for (const [key, { newValue }] of Object.entries(changes)) {
    settings[key] = newValue;
  }
});

window.addEventListener("popstate", () => {
  const firstPosts = $(".stream-container").slice(-2);
  if (firstPosts.length) {
    filter(firstPosts);
  }
  // Attempt to restore scroll position when returning to a page
  restoreScrollPosition();
});

// Check if jQuery/Cash.js is available
if (typeof $ === 'undefined') {
  console.error('9gag Post Filter: jQuery/Cash.js is not loaded. Extension cannot function.');
  throw new Error('Required library $ is not available');
}

// Main initialization - wait for settings to load
(async function initExtension() {
  await settingsLoaded;

  const containerElement = document.getElementById("container");
  if (containerElement && isValidFilterUrl("/u/", "/gag/")) {
    createAddObserver(
      containerElement,
      (addedNode) => {
        if (typeof addedNode.className === "string" && addedNode.className.includes("list-view")) {
          initialize();
        }
      },
      { childList: true, subtree: true },
    );

    setTimeout(() => {
      let attempts = 0;
      const interval = setInterval(() => {
        const firstPosts = $(".stream-container");
        if (firstPosts.length || attempts >= CONSTANTS.MAX_RETRIES) {
          if (firstPosts.length) {
            filter(firstPosts);
          }
          clearInterval(interval);
        }
        attempts++;
      }, CONSTANTS.CHECK_INTERVAL);
    }, CONSTANTS.INITIAL_DELAY);

    const recheckInterval = setInterval(() => {
      const unprocessedPosts = $("article:not(.filtered):not(.filtering)");
      if (unprocessedPosts.length > 0) {
        console.log(`Found ${unprocessedPosts.length} unprocessed posts, filtering...`);
        unprocessedPosts.each((i, post) => {
          const $post = $(post);
          const container = $post.closest(".stream-container");
          if (container.length) {
            filter(container);
          }
        });
      }
    }, CONSTANTS.RECHECK_INTERVAL);
    activeIntervals.push(recheckInterval);
  }
})();

// Cleanup intervals on page unload to prevent memory leaks
window.addEventListener('beforeunload', () => {
  activeIntervals.forEach(interval => clearInterval(interval));
  activeIntervals = [];
});

// Periodic cache cleanup to prevent memory leaks
const cacheCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [username, cached] of userDataCache.entries()) {
    if (now - cached.timestamp >= CONSTANTS.CACHE_DURATION) {
      userDataCache.delete(username);
    }
  }
}, CONSTANTS.CACHE_DURATION); // Run cleanup every 5 minutes
activeIntervals.push(cacheCleanupInterval);

function initialize() {
  const listView = document.getElementById("list-view-2");
  if (listView) {
    createAddObserver(listView, (addedNode) => {
      if (addedNode.className && addedNode.className.includes("stream-container")) {
        filter(addedNode);
      }
    });
  }
}

function getCachedUserData(username) {
  const cached = userDataCache.get(username);
  if (cached && Date.now() - cached.timestamp < CONSTANTS.CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedUserData(username, data) {
  userDataCache.set(username, {
    data,
    timestamp: Date.now(),
  });
}

async function fetchUserData(username) {
  try {
    const cached = getCachedUserData(username);
    if (cached) {
      return cached;
    }

    if (pendingRequests.has(username)) {
      return await pendingRequests.get(username);
    }

    const requestPromise = fetch(`https://9gag.com/v1/user-posts/username/${username}/type/posts`, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.5",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
      referrer: "https://9gag.com",
      referrerPolicy: "strict-origin-when-cross-origin",
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

  const video = post.find("video").first();
  if (video.length) {
    video.attr("controls", "controls");
  }
}

async function addUsername(post, articleId) {
  try {
    const name = await getNameFromMenu(articleId);
    if (!name) return null;

    if (!post.find(".ui-post-creator__author").length) {
      // Sanitize username to prevent XSS
      const sanitizedName = document.createElement('div');
      sanitizedName.textContent = name;
      const safeName = sanitizedName.innerHTML;

      const userLink = `<span>| <a class="user-link" href="https://9gag.com/u/${encodeURIComponent(name)}">@${safeName}</a></span>`;
      post.find(".post-header__left").first().append(userLink);
      post.find(".post-meta.mobile").first().append(userLink);
    }

    return name;
  } catch (error) {
    console.error("Error adding username:", error);
    return null;
  }
}

function hideCheersBadges(post) {
  if (settings.cheers && post.find(".post-award").length) {
    post.find(".post-award").hide();
  }

  if (settings.cheers && post.find(".post-award-users").length) {
    post.find(".post-award-users").hide();
  }
}

function hideMemeButton(post) {
  if (settings.hide_meme) {
    post.find(".create-meme-btn").hide();
  }
}

function calculateAccountAge(creationTs) {
  const now = Date.now() / 1000;
  const diff = now - creationTs;
  return Math.floor(diff / CONSTANTS.SECONDS_PER_DAY);
}

function addAccountAge(post, days) {
  if (!settings.show_days) return;

  const diffSpan = `<span>| ${days} days </span>`;
  if (post.find(".ui-post-creator").length) {
    post.find(".ui-post-creator").append(diffSpan);
  } else {
    post.find(".post-header__left").append(diffSpan);
    post.find(".post-meta.mobile").append(diffSpan);
  }
}

function filterByMinDays(post, days) {
  if (settings.min_days > 0 && settings.min_days > days) {
    post.addClass("hidden filtered");
    post.closest(".stream-container").first().css("min-height", "auto");
    return true;
  }
  return false;
}

function calculateSpamScore(posts) {
  if (posts.length < CONSTANTS.MIN_POSTS_FOR_SPAM_CHECK) {
    return null;
  }

  const postDiffs = posts.map((p, i) => {
    if (i === 0) {
      return (Date.now() / 1000 - p.creationTs) / 3600;
    }
    return (posts[i - 1].creationTs - p.creationTs) / 3600;
  });

  return postDiffs.reduce((a, b) => a + b) / postDiffs.length;
}

function handleSpammer(post, avgHoursBetweenPosts) {
  const threshold = !isNaN(settings.spammers_hours) ? settings.spammers_hours : CONSTANTS.DEFAULT_SPAMMER_HOURS;

  if (avgHoursBetweenPosts < threshold) {
    if (settings.hide_spammers) {
      post.remove();
      return true;
    } else {
      const label = `<span class="spammer-label">| SPAMMER</span>`;
      if (post.find(".ui-post-creator").length) {
        post.find(".ui-post-creator").append(label);
      } else {
        post.find(".post-header__left").append(label);
        post.find(".post-meta.mobile").append(label);
      }
    }
  }
  return false;
}

function getPostId(post) {
  try {
    const headerLinks = post.find("header a");
    if (!headerLinks || !headerLinks.length) return null;

    const lastLink = headerLinks[headerLinks.length - 1];
    if (!lastLink || !lastLink.href) return null;

    const parts = lastLink.href.split("/");
    if (!parts || parts.length === 0) return null;

    const postId = parts[parts.length - 1];
    return postId || null;
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

  if (settings.more_downvotes && downvotes >= upvotes) {
    post.hide();
    return true;
  }

  const upvoteElement = post.find(".upvote").eq(1);
  if (settings.always_display_upvotes && upvoteElement.length && upvoteElement.html() === "•") {
    upvoteElement.html(upvotes);
  }

  // Sanitize vote counts (should be numbers, but be safe)
  const safeDownvotes = parseInt(downvotes, 10) || 0;
  const downvoteSpan = `<span class="post-vote__text downvote upvote">${safeDownvotes}</span>`;
  post.find(".post-vote").append(downvoteSpan);
  post.find(".downvote.grouped").after(`<span class="post-vote__text downvote">${safeDownvotes}</span>`);

  return false;
}

async function processPost(post) {
  const postElement = post[0];

  if (processedPosts.has(postElement)) {
    return;
  }

  try {
    post.addClass("filtering");
    processedPosts.add(postElement);

    addVideoControls(post);
    hideCheersBadges(post);
    hideMemeButton(post);

    const articleId = post.attr("id");
    if (!articleId) {
      post.addClass("filtered");
      return;
    }

    const username = await addUsername(post, articleId);
    if (!username) {
      post.addClass("filtered");
      return;
    }

    if (settings.show_days || settings.min_days > 0 || settings.spammers || settings.more_downvotes || settings.always_display_upvotes) {
      const userData = await fetchUserData(username);
      if (!userData || !userData.data) {
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

      if (settings.spammers) {
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
    const posts = $(addedNode)
      .contents()
      .find("article:not(.filtered):not(.filtering)")
      .add($(addedNode).filter("article:not(.filtered):not(.filtering)"))
      .add($(".list-view__content article:not(.filtered):not(.filtering)"));

    if (!posts.length) {
      return;
    }

    if (settings.hide_spammers || settings.more_downvotes) {
      $(addedNode).addClass("filtered");
    }

    const BATCH_SIZE = 5;
    const postsArray = posts.get();

    for (let i = 0; i < postsArray.length; i += BATCH_SIZE) {
      const batch = postsArray.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((element) => processPost($(element))));
    }
  } catch (error) {
    console.error("Error in filter function:", error);
  }
}

// Scroll position handling
const SCROLL_STORAGE_PREFIX = '9gag_post_filter_scroll_';
const HEADER_OFFSET = 60; // Adjust based on 9gag's sticky header

function getStorageKey(path) {
  return SCROLL_STORAGE_PREFIX + (path || window.location.pathname);
}

function getTopVisibleArticle() {
  const articles = document.querySelectorAll('article');
  for (const article of articles) {
    const rect = article.getBoundingClientRect();
    // Return the first article that is substantially visible or at the top
    if (rect.top >= -100 && rect.top < window.innerHeight && article.id) {
      return article.id;
    }
  }
  return null;
}

function saveScrollPosition() {
  const currentPath = window.location.pathname;
  const topArticleId = getTopVisibleArticle();
  const scrollY = window.scrollY;

  const data = {
    timestamp: Date.now(),
    articleId: topArticleId,
    scrollY: scrollY
  };

  try {
    sessionStorage.setItem(getStorageKey(currentPath), JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save scroll position', e);
  }
}

// Event listener for navigation clicks to save scroll position
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.href) {
    try {
        const url = new URL(link.href, window.location.origin);
        // Only save if it's a navigation to a different path on the same origin
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
            saveScrollPosition();
        }
    } catch (err) {
        // Ignore invalid URLs
    }
  }
}, true); // Capture phase to ensure we catch it before navigation

function restoreScrollPosition() {
  const currentPath = window.location.pathname;
  const key = getStorageKey(currentPath);
  let savedData = null;

  try {
    const json = sessionStorage.getItem(key);
    if (json) {
      savedData = JSON.parse(json);
    }
  } catch (e) {
    console.warn('Failed to parse saved scroll position', e);
  }

  if (!savedData) return;

  // We have saved data. Attempt to restore.
  // We try to find the element first, fallback to pixel scroll.
  let attempts = 0;
  const maxAttempts = 20; // 20 * 100ms = 2 seconds
  const interval = setInterval(() => {
    let restored = false;

    // Strategy 1: Scroll to specific article
    if (savedData.articleId) {
      const article = document.getElementById(savedData.articleId);
      if (article) {
        const rect = article.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top;
        window.scrollTo({
          top: absoluteTop - HEADER_OFFSET,
          behavior: 'auto' // Instant jump
        });
        restored = true;
      }
    }

    // Strategy 2: Fallback to pixel position if article not found (or not saved)
    // Only if we haven't restored via element yet.
    if (!restored && savedData.scrollY > 0) {
      // Check if page height is sufficient
      if (document.body.scrollHeight >= savedData.scrollY) {
        window.scrollTo(0, savedData.scrollY);
        // If we are close enough, consider it done?
        // No, pixel scroll is brittle. We keep retrying until element appears or timeout?
        // If we scroll to pixel, we might be done if element never appears.

        // Let's check if we are close to the target
        if (Math.abs(window.scrollY - savedData.scrollY) < 50) {
            restored = true;
        }
      }
    }

    attempts++;

    // Stop if we successfully restored (found element) or max attempts reached
    if (restored || attempts >= maxAttempts) {
      clearInterval(interval);
      // Optional: Clear storage after successful restoration?
      // No, because user might navigate forward and back again.
      // But maybe we should clear it if we navigate away?
      // Current logic overwrites on navigation away.
    }
  }, 100);
}
