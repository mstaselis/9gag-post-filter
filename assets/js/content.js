var settings;
var $tags = [];

var k = 0; //numerical id for id-less elements, mostly on mobile browser
chrome.storage.local.get(["show_days", "min_days", "verified", "promoted", "tags", "spammers", "spammers_hours", "cheers", "more_downvotes", "hide_spammers"], (data) => {
  settings = data;
  if (settings.tags !== undefined) {
    $tags = settings.tags;
    $tags = $tags.trim().split(",");
  }
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
}

function initialize() {
  const listView = document.getElementById("list-view-2");
  if (listView) {
    createAddObserver(listView, (addedNode) => {
      if (addedNode.className && addedNode.className.includes("stream-container")) {
        //stream container added
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

          //get tags
          let post_tags = [];
          post
            .find(".post-tags")
            .children()
            .each((index, element) => {
              post_tags.push($(element).text().toLowerCase());
            });
          if (post.find(".post-meta__list-view .name").length) post_tags.push(post.find(".post-meta__list-view .name").first().text().toLowerCase());

          if (
            (document.querySelectorAll("#" + art_id + " .ui-post-creator__badge").length > 0 && settings.verified) || // hide verified
            ($("#" + art_id + " .ui-post-creator__author").hasClass("promoted") && settings.promoted) // hide promoted
          ) {
            $(this).hide();
            $(this).addClass("filtered");
            return;
          }
        });
      }
    });
  }
}
