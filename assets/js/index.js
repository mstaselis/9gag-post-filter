var days_input = $("#days_input");
var show_days = $("#days_checkbox");
var spammers_checkbox = $("#spammers_checkbox");
var spammers_input = $("#spammers_input");
var cheers_checkbox = $("#cheers_checkbox");
var more_downvotes_checkbox = $("#more_downvotes_checkbox");
var hide_spammers_checkbox = $("#hide_spammers_checkbox");
var always_display_upvotes_checkbox = $("#always_display_upvotes_checkbox");

chrome.storage.local.get(settingsKeys, (data) => {
  show_days.prop("checked", data.show_days);
  days_input.val(data.min_days);
  spammers_checkbox.prop("checked", data.spammers);
  spammers_input.val(data.spammers_hours);
  cheers_checkbox.prop("checked", data.cheers);
  more_downvotes_checkbox.prop("checked", data.more_downvotes);
  hide_spammers_checkbox.prop("checked", data.hide_spammers);
  always_display_upvotes_checkbox.prop("checked", data.always_display_upvotes);
});

show_days.on("change", async function () {
  chrome.storage.local.set({ show_days: show_days.prop("checked") }).then(() => {});
});

days_input.on("change", async function () {
  chrome.storage.local.set({ min_days: days_input.val() }).then(() => {
    // alert("Value is set to " + $show_days.prop("checked"));
  });
});

spammers_checkbox.on("change", async function () {
  chrome.storage.local.set({ spammers: spammers_checkbox.prop("checked") }).then(() => {
    // alert("Value is set to " + $show_days.prop("checked"));
  });
});

spammers_input.on("change", async function () {
  chrome.storage.local.set({ spammers_hours: spammers_input.val() }).then(() => {
    // alert("Value is set to " + $show_days.prop("checked"));
  });
});

cheers_checkbox.on("change", async function () {
  chrome.storage.local.set({ cheers: cheers_checkbox.prop("checked") }).then(() => {
    // alert("Value is set to " + $show_days.prop("checked"));
  });
});

more_downvotes_checkbox.on("change", async function () {
  chrome.storage.local.set({ more_downvotes: more_downvotes_checkbox.prop("checked") }).then(() => {
    // alert("Value is set to " + $show_days.prop("checked"));
  });
});

hide_spammers_checkbox.on("change", async function () {
  chrome.storage.local.set({ hide_spammers: hide_spammers_checkbox.prop("checked") }).then(() => {
    // alert("Value is set to " + $show_days.prop("checked"));
  });
});

always_display_upvotes_checkbox.on("change", async function () {
  chrome.storage.local.set({ always_display_upvotes: always_display_upvotes_checkbox.prop("checked") }).then(() => {
    // alert("Value is set to " + $show_days.prop("checked"));
  });
});
