// Every selector that depends on 9gag's markup lives here, so a layout change
// is fixed in one file. Comma-separated lists hold the current layout first and
// the previous layout after it, in case 9gag rolls back or A/B-tests the old one.
const SELECTORS = {
  // Containers our labels (username, account age, SPAMMER) are appended to,
  // tried in this order.
  postMetaTargets: [".compact-post-meta .byline", ".ui-post-creator", ".post-header__left", ".post-meta.mobile"],
  // Header link to the author's profile (user posts only; interest posts link
  // the byline to the interest instead).
  authorShown: ".ui-post-creator__author, .byline a.name[href*='/u/']",
  authorProfileLink: "header a[href*='/u/']",
  // Links to other users that appear in the header before the author's.
  otherUserLinkContainers: ".post-award-users, .post-top-comment",

  header: "header",
  title: "header h2",
  postLink: "header a[href*='/gag/']",

  upvoteCount: "span.upvote",
  downvoteButton: ".downvote.grouped",
  legacyVoteContainer: ".post-vote",

  postMenu: ".uikit-popup-menu",
  postMenuButton: ".button",
  postMenuLinks: ".menu a",

  video: "video",
  // "Hide cheers" (.post-award, .post-award-users) and "Hide create meme
  // button" (.create-meme-btn) are applied in content.css.
};

// Selectors every rendered post is expected to match at least once. If none of
// the processed posts on a page match one of these, 9gag has most likely
// changed its layout, and the content script logs a warning naming it.
const REQUIRED_SELECTORS = {
  postMetaTargets: SELECTORS.postMetaTargets.join(", "),
  title: SELECTORS.title,
  postLink: SELECTORS.postLink,
  upvoteCount: SELECTORS.upvoteCount,
  downvoteButton: SELECTORS.downvoteButton,
};
