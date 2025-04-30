var settings;
var $tags = [];

var k = 0; //numerical id for id-less elements, mostly on mobile browser
chrome.storage.local.get(
  [
    "show_days",
    "min_days",
    "anon",
    "verified",
    "promoted",
    "tags",
    "title",
    "spammers",
    "spammers_hours",
    "cheers",
    "more_downvotes",
    "hide_spammers",
  ],
  (data) => {
    settings = data;
    if (settings.tags !== undefined) {
      $tags = settings.tags;
      $tags = $tags.trim().split(",");
    }
  },
);

const myTimeout = setTimeout(function () {
  setInterval(async function () {
    ////console.log(settings);
    await $(
      "#list-view-2 article:not(.filtered,.filtering), .list-view__content article:not(.filtered,.filtering)",
    ).each(async function () {
      // //console.log('filtering ', $(this));
      $(this).addClass("filtering");
      if ($(this).attr("id") === undefined) {
        $(this).attr("id", "custom-id-" + k);
        k++;
      }
      //console.log($(this), $(this).attr("id")+" is unfiltered")

      let art_id = $(this).attr("id");
      let article = document.querySelector("#" + art_id);
      let name =
        document.querySelector("#" + art_id + " .ui-post-creator__author") !==
        null
          ? document.querySelector("#" + art_id + " .ui-post-creator__author")
              .text
          : await getNameFromMenu(art_id);
      if (document.querySelector("#" + art_id + " .ui-post-creator") === null) {
        $("#" + art_id + " .post-header__left").append(
          `<span>| <a class="user-link" href="https://9gag.com/u/${name}">@${name}</a></span>`,
        );
        $("#" + art_id + " .post-meta.mobile").append(
          `<br/><span> <a class="user-link" href="https://9gag.com/u/${name}">@${name}</a></span>`,
        );
      }
      //console.log(article, 'name after func',name);
      // let name = 'aaaaa';

      let title = $("#" + art_id + " header a h2").text();

      let post_tags = [];
      $("#" + art_id + " .post-tags")
        .children()
        .each(function () {
          post_tags.push($(this).text().toLowerCase());
        });
      if (
        document.querySelector(
          "#" + art_id + " .post-meta__list-view .name",
        ) !== null
      )
        post_tags.push(
          document
            .querySelector("#" + art_id + " .post-meta__list-view .name")
            .text.toLowerCase(),
        );
      //console.log(article,"post tags", post_tags);
      //console.log(article,"global tags", $tags);

      if (
        (name == "9GAGGER" && settings.anon) || //hide anons
        (document.querySelectorAll("#" + art_id + " .ui-post-creator__badge")
          .length > 0 &&
          settings.verified) || // hide verified
        ($("#" + art_id + " .ui-post-creator__author").hasClass("promoted") &&
          settings.promoted) // hide promoted
      ) {
        //console.log("anon/promoted need to hide ",article);
        $(this).hide();
        $(this).addClass("filtered");
        return;
      }

      for (let i = 0; i < $tags.length; i++) {
        //hide tags
        let tag = $tags[i];
        //console.log(article,"tag ", tag);
        //console.log(article,"in post> ", post_tags.includes(tag));
        if (
          (settings.title &&
            title.toLowerCase().indexOf(tag.trim().toLowerCase()) > -1 &&
            tag.trim().toLowerCase() !== "") || //search by title
          post_tags.includes(tag) //search by post tags
        ) {
          //console.log(article,'filtered by tags');
          $("#" + art_id).hide();
          $(this).addClass("filtered");
          return;
        }
      }

      if (settings.cheers) {
        $("#" + art_id + " a.post-award-btn").hide();
        $("#" + art_id + " post-award-users").hide();
      }

      //keep days stuff for last, no unnecessary http requests
      if ((settings.show_days || settings.min_days > 0) && name != "9GAGGER") {
        ////console.log("GETting...");
        const response = await fetch(
          "https://9gag.com/v1/user-posts/username/" + name + "/type/posts",
          {
            headers: {
              accept: "*/*",
              "accept-language": "en-US,en;q=0.5",
              "sec-ch-ua":
                '"Not.A/Brand";v="8", "Chromium";v="114", "Brave";v="114"',
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
          },
        );
        const json = await response.json();
        //console.log(json);
        let creatorCreation = json.data.profile.creationTs;
        //console.log(article,'creator ts',creatorCreation);

        let now = Date.now() / 1000;
        let diff = now - creatorCreation;
        diff = diff / 86400; //in days
        diff = parseInt(diff);
        ////console.log(settings.min_days+" ?? "+diff)
        if (settings.min_days > diff) {
          //hide users that are too young
          //console.log(article,"creator too new");
          $("#" + art_id).hide();
          $("#" + art_id).addClass("filtered");
          return;
        }
        if (document.querySelector("#" + art_id + " .ui-post-creator") !== null)
          $("#" + art_id + " .ui-post-creator").append("| " + diff + " days");
        else {
          $("#" + art_id + " .post-header__left").append(
            "<span>| " + diff + " days</span>",
          );
          $("#" + art_id + " .post-meta.mobile").append(
            "<span>| " + diff + " days</span>",
          );
        }

        // const json = JSON.parse(jsonString);

        ////console.log('jsonString2', json); // JSON.parse("{"key": "value"}")
        if (settings.spammers && json.data.posts.length >= 10) {
          let posts = json.data.posts;
          let postDiff = [];
          for (let i = 0; i < posts.length; i++) {
            let creationTs = posts[i].creationTs;
            if (i == 0)
              postDiff[i] = (Date.now() / 1000 - creationTs) / 3600; //as hours
            else postDiff[i] = (posts[i - 1].creationTs - creationTs) / 3600;
          }
          ////console.log(name+" diffs ",postDiff);
          const average = (array) =>
            array.reduce((a, b) => a + b) / array.length;
          let diffAve = average(postDiff);
          ////console.log("averages: ",diffAve);

          ////console.log('diffsetting ',settings.spammers_hours);
          // ////console.log('stuff ',Number(settings.spammers_hours));
          let diffset = !isNaN(settings.spammers_hours)
            ? settings.spammers_hours
            : 12;
          ////console.log('diffset ',diffset);
          if (diffAve < diffset) {
            if (settings.hide_spammers) {
              $("#" + art_id).hide();
              $("#" + art_id).addClass("filtered");
            } else {
              if (
                document.querySelector("#" + art_id + " .ui-post-creator") !==
                null
              )
                $("#" + art_id + " .ui-post-creator").append(
                  `<span class="spammer-label">| SPAMMER</span>`,
                );
              else {
                $("#" + art_id + " .post-header__left").append(
                  `<span class="spammer-label">| SPAMMER</span>`,
                );
                $("#" + art_id + " .post-meta.mobile").append(
                  `<span class="spammer-label">| SPAMMER</span>`,
                );
              }
            }
          }
        }
        // //console.log($("#"+art_id+" header a"));

        let post_id = [...document.querySelectorAll("#" + art_id + " header a")]
          .at(-1)
          .href.split("/")
          .at(-1);
        // //console.log('post_id',post_id);
        //return the downvotes
        let posts = json.data.posts;
        let downvotes = null;
        let upvotes = null;

        for (let i = 0; i < posts.length; i++) {
          if (posts[i].id == post_id) {
            downvotes = posts[i].downVoteCount;
            upvotes = posts[i].upVoteCount;
            break;
          }
        }
        ////console.log('postId ',post_id," downvotes", downvotes);
        if (downvotes !== null) {
          if (settings.more_downvotes && downvotes >= upvotes) {
            $("#" + art_id).hide();
          }
          if (
            $("#" + art_id + " .upvote")
              .eq(1)
              .html() == "•"
          ) {
            $("#" + art_id + " .upvote")
              .eq(1)
              .html(upvotes);
          }
          $("#" + art_id + " .post-vote").append(
            `<span class="post-vote__text downvote upvote">${downvotes}</span>`,
          );
          $("#" + art_id + " .downvote.grouped ").after(
            `<span class="post-vote__text downvote">${downvotes}</span>`,
          );
        }
      }
      try {
        console.debug(
          "tring to enable controls for " + art_id,
          $("#" + art_id + ""),
        );
        $("#" + art_id + " video").prop("controls", true); //enable controls for videos
      } catch (e) {
        console.debug("can't enable controls for " + art_id, e);
      }
      $(this).addClass("filtered");
    });
  }, 500);
}, 1000);
