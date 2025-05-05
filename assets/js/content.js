var settings;

var k = 0; //numerical id for id-less elements, mostly on mobile browser
chrome.storage.local.get(["show_days", "min_days", "spammers", "spammers_hours", "cheers", "more_downvotes", "hide_spammers", "always_display_upvotes"], (data) => {
  settings = data;
});

const containerElement = document.getElementById("container");
if (containerElement && !window.location.pathname.includes("/u/")) {
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
    var firstPosts = $(".stream-container");
    if (firstPosts) {
      filter(firstPosts);
    }
  }, 1000);
}

function initialize() {
  const listView = document.getElementById("list-view-2");
  if (listView) {
    createAddObserver(listView, (addedNode) => {
      if (addedNode.className && addedNode.className.includes("stream-container")) {
        //stream container added
        filter(addedNode);
      }
    });
  }
}

function filter(addedNode) {
  var posts = $(addedNode).contents().find("article:not(.filtered,.filtering), .list-view__content article:not(.filtered,.filtering)");

  posts.each(async (i, e) => {
    var post = $(e);
    post.addClass("filtering");

    //add name
    let art_id = post.attr("id");
    let name = post.find(".ui-post-creator__author").length ? post.find(".ui-post-creator__author").first().text() : await getNameFromMenu(art_id);
    if (!post.find(".ui-post-creator__author").length) {
      post.find(".post-header__left").first().append(`<span>| <a class="user-link" href="https://9gag.com/u/${name}">@${name}</a></span>`);
      post.find(".post-meta.mobile").first().append(`<span>| <a class="user-link" href="https://9gag.com/u/${name}">@${name}</a></span>`);
    }

    //cheers
    if (settings.cheers) {
      if (post.find(".post-award-users").length) post.find(".post-award-users").hide();
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
          post.hide();
          post.addClass("filtered");
          return;
        }
        if (post.find(".ui-post-creator").length) post.find(".ui-post-creator").append("| " + diff + " days");
        else {
          post.find(".post-header__left").append("<span>| " + diff + " days</span>");
          post.find(".post-meta.mobile").append("<span>| " + diff + " days</span>");
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
              post.hide();
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
  });
}
