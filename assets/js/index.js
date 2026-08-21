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
};

for (const [id, key] of Object.entries(checkboxMap)) {
  $(`#${id}`).on("change", function () {
    chrome.storage.local.set({ [key]: $(this).prop("checked") });
  });
}

// Numeric inputs
days_input.on("change", function () {
  chrome.storage.local.set({ min_days: days_input.val() });
});

spammers_hours_input.on("change", function () {
  chrome.storage.local.set({ spammers_hours: spammers_hours_input.val() });
});
