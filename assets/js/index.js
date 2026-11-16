var days_input = $("#days_input");
var spammers_hours_input = $("#spammers_hours_input");

chrome.storage.local.get(settingsKeys, (data) => {
  $("#days_checkbox").prop("checked", data.show_days);
  days_input.val(data.min_days);
  $("#spammers_checkbox").prop("checked", data.spammers);
  spammers_hours_input.val(data.spammers_hours);
  $("#cheers_checkbox").prop("checked", data.cheers);
  $("#more_downvotes_checkbox").prop("checked", data.more_downvotes);
  $("#hide_spammers_checkbox").prop("checked", data.hide_spammers);
  $("#always_display_upvotes_checkbox").prop("checked", data.always_display_upvotes);
  $("#show_controls_checkbox").prop("checked", data.show_controls);
  $("#hide_meme_checkbox").prop("checked", data.hide_meme);
  $("#hide_emoji_title_checkbox").prop("checked", data.hide_emoji_title);
  $("#remove_hidden_checkbox").prop("checked", data.remove_hidden);
  $("#wide_media_checkbox").prop("checked", data.wide_media);
});

// Generic handler for all toggle switches
const checkboxMap = {
  days_checkbox:                    "show_days",
  spammers_checkbox:                "spammers",
  cheers_checkbox:                  "cheers",
  more_downvotes_checkbox:          "more_downvotes",
  hide_spammers_checkbox:           "hide_spammers",
  always_display_upvotes_checkbox:  "always_display_upvotes",
  show_controls_checkbox:           "show_controls",
  hide_meme_checkbox:               "hide_meme",
  hide_emoji_title_checkbox:        "hide_emoji_title",
  remove_hidden_checkbox:           "remove_hidden",
  wide_media_checkbox:              "wide_media",
};

for (const [id, key] of Object.entries(checkboxMap)) {
  $(`#${id}`).on("change", function () {
    chrome.storage.local.set({ [key]: $(this).prop("checked") });
  });
}

// Numeric inputs: store a positive number, or remove the key when the box is
// cleared (or holds 0 / garbage) so the content script uses its default.
// Storing the raw string made a cleared spammer threshold compare as 0, which
// silently stopped anyone from being flagged.
function saveNumber(key, input) {
  const value = parseFloat(input.val());
  if (Number.isFinite(value) && value > 0) {
    chrome.storage.local.set({ [key]: value });
  } else {
    chrome.storage.local.remove(key);
    input.val("");
  }
}

days_input.on("change", () => saveNumber("min_days", days_input));
spammers_hours_input.on("change", () => saveNumber("spammers_hours", spammers_hours_input));
