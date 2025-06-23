var settings;

var k = 0; //numerical id for id-less elements, mostly on mobile browser
chrome.storage.local.get(settingsKeys, function (data) {
  settings = Object.assign({}, data);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    settings[key] = newValue;
  }
});

const containerElement = document.getElementById("container");
if (containerElement && isValidFilterUrl("/u/", "/gag/")) {
  createAddObserver(
    containerElement,
    (addedNode) => {
      if (addedNode.className && addedNode.className.includes("list-view")) {
        initialize();
      }
    },
    { childList: true, subtree: true },
  );

  setTimeout(() => {
    //filter first records
    const interval = setInterval(() => {
      const firstPosts = $(".stream-container");
      if (firstPosts.length) {
        filter(firstPosts);
        clearInterval(interval); // Stop checking once found
      }
    }, 500);
  }, 500);
}

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

async function filter(addedNode) {
  var posts = $(addedNode).contents().find("article:not(.filtered,.filtering), .list-view__content article:not(.filtered,.filtering)");

  if (settings.hide_spammers || settings.more_downvotes) {
    $(addedNode).addClass("filtered");
  }

  await Promise.all(
    posts.map(async (i, e) => {
      var post = $(e);
      post.addClass("filtering");

      if (settings.show_controls) {
        if (post.find("video").length) {
          post.find("video").first().attr("controls", "controls");
        }
      }

      //add name
      let art_id = post.attr("id");

      const name = await getNameFromMenu(art_id);
      if (!post.find(".ui-post-creator__author").length) {
        post.find(".post-header__left").first().append(`<span>| <a class="user-link" href="https://9gag.com/u/${name}">@${name}</a></span>`);
        post.find(".post-meta.mobile").first().append(`<span>| <a class="user-link" href="https://9gag.com/u/${name}">@${name}</a></span>`);
      }

      //cheers
      if (settings.cheers) {
        if (post.find(".post-award-users").length) post.find(".post-award-users").hide();
      }

      //hide meme button
      if (settings.hide_meme) {
        post.find(".create-meme-btn").hide();
      }

      //days and other stuff
      if (settings.show_days || settings.min_days > 0) {
        const response = await fetch("https://9gag.com/v1/user-posts/username/" + name + "/type/posts", {
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.5",
            "sec-ch-ua": '"Not.A/Brand";v="8", "Chromium";v="114", "Brave";v="114"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"Android"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "sec-gpc": "1",
          },
          referrer: "https://9gag.com",
          referrerPolicy: "strict-origin-when-cross-origin",
          body: null,
          method: "POST",
          mode: "cors",
          credentials: "include",
        });
        const json = await response.json();
        if (json) {
          let creatorCreation = json.data.profile.creationTs;

          let now = Date.now() / 1000;
          let diff = now - creatorCreation;
          diff = diff / 86400; //in days
          diff = parseInt(diff);

          if (settings.min_days > diff) {
            post.addClass("hidden");
            post.addClass("filtered");
            post.closest(".stream-container").first().css("min-height", "auto");
            return;
          }

          const diffSpan = `<span>| ${diff} days </span>`;
          if (post.find(".ui-post-creator").length) {
            post.find(".ui-post-creator").append(diffSpan);
          } else {
            post.find(".post-header__left").append(diffSpan);
            post.find(".post-meta.mobile").append(diffSpan);
          }

          if (settings.spammers && json.data.posts.length >= 10) {
            let posts = json.data.posts;
            let postDiff = [];
            for (let i = 0; i < posts.length; i++) {
              let creationTs = posts[i].creationTs;
              if (i == 0)
                postDiff[i] = (Date.now() / 1000 - creationTs) / 3600; //as hours
              else postDiff[i] = (posts[i - 1].creationTs - creationTs) / 3600;
            }
            const average = (array) => array.reduce((a, b) => a + b) / array.length;
            let diffAve = average(postDiff);
            let diffset = !isNaN(settings.spammers_hours) ? settings.spammers_hours : 12;

            if (diffAve < diffset) {
              if (settings.hide_spammers) {
                post.remove();
              } else {
                if (post.find(".ui-post-creator").length) post.find(".ui-post-creator").append(`<span class="spammer-label">| SPAMMER</span>`);
                else {
                  post.find(".post-header__left").append(`<span class="spammer-label">| SPAMMER</span>`);
                  post.find(".post-meta.mobile").append(`<span class="spammer-label">| SPAMMER</span>`);
                }
              }
            }
          }

          let post_id = [...post.find("header a")].at(-1).href.split("/").at(-1);

          let posts = json.data.posts;
          let downvotes = null;
          let upvotes = null;

          for (let i = 0; i < posts.length; i++) {
            if (posts[i].id === post_id) {
              downvotes = posts[i].downVoteCount;
              upvotes = posts[i].upVoteCount;
              break;
            }
          }

          if (downvotes !== null) {
            if (settings.more_downvotes && downvotes >= upvotes) {
              post.hide();
            }

            if (settings.always_display_upvotes && post.find(".upvote").eq(1).html() == "•") {
              post.find(".upvote").eq(1).html(upvotes);
            }
            post.find(".post-vote").append(`<span class="post-vote__text downvote upvote">${downvotes}</span>`);
            post.find(".downvote.grouped").after(`<span class="post-vote__text downvote">${downvotes}</span>`);
          }
        }
      }

      post.addClass("filtered");
    }),
  );
}
