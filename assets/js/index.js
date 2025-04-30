var $show_days = $("#days_checkbox");
var $days_input = $("#days_input");
var $verified_checkbox = $("#verified_checkbox");
var $promoted_checkbox = $("#promoted_checkbox");
var $tags_area = $("#tags_area");
var $spammers_checkbox = $("#spammers_checkbox");
var $spammers_input = $("#spammers_input");
var $cheers_checkbox = $("#cheers_checkbox");
var $more_downvotes_checkbox = $("#more_downvotes_checkbox");
var $hide_spammers_checkbox = $("#hide_spammers_checkbox");

chrome.storage.local.get(
  [
    "show_days",
    "min_days",
    "verified",
    "promoted",
    "tags",
    "spammers",
    "spammers_hours",
    "cheers",
    "more_downvotes",
    "hide_spammers",
  ],
  (data) => {
    $show_days.prop("checked", data.show_days);
    $verified_checkbox.prop("checked", data.verified);
    $days_input.val(data.min_days);
    $promoted_checkbox.prop("checked", data.promoted);
    $tags_area.val(data.tags);
    $spammers_checkbox.prop("checked", data.spammers);
    $spammers_input.val(data.spammers_hours);
    $cheers_checkbox.prop("checked", data.cheers);
    $more_downvotes_checkbox.prop("checked", data.more_downvotes);
    $hide_spammers_checkbox.prop("checked", data.hide_spammers);
  },
);

$show_days.on("change", async function () {
  chrome.storage.local
    .set({ show_days: $show_days.prop("checked") })
    .then(() => {
      // alert("Value is set to " + $show_days.prop("checked"));
    });
});

$verified_checkbox.on("change", async function () {
  chrome.storage.local
    .set({ verified: $verified_checkbox.prop("checked") })
    .then(() => {
      // alert("Value is set to " + $show_days.prop("checked"));
    });
});

$days_input.on("change", async function () {
  chrome.storage.local.set({ min_days: $days_input.val() }).then(() => {
    // alert("Value is set to " + $show_days.prop("checked"));
  });
});

$promoted_checkbox.on("change", async function () {
  chrome.storage.local
    .set({ promoted: $promoted_checkbox.prop("checked") })
    .then(() => {
      // alert("Value is set to " + $show_days.prop("checked"));
    });
});

$tags_area.on("change", async function () {
  chrome.storage.local.set({ tags: $tags_area.val() }).then(() => {
    // alert("Value is set to " + $tags_area.val());
  });
});

$spammers_checkbox.on("change", async function () {
  chrome.storage.local
    .set({ spammers: $spammers_checkbox.prop("checked") })
    .then(() => {
      // alert("Value is set to " + $show_days.prop("checked"));
    });
});

$spammers_input.on("change", async function () {
  chrome.storage.local
    .set({ spammers_hours: $spammers_input.val() })
    .then(() => {
      // alert("Value is set to " + $show_days.prop("checked"));
    });
});

$cheers_checkbox.on("change", async function () {
  chrome.storage.local
    .set({ cheers: $cheers_checkbox.prop("checked") })
    .then(() => {
      // alert("Value is set to " + $show_days.prop("checked"));
    });
});

$more_downvotes_checkbox.on("change", async function () {
  chrome.storage.local
    .set({ more_downvotes: $more_downvotes_checkbox.prop("checked") })
    .then(() => {
      // alert("Value is set to " + $show_days.prop("checked"));
    });
});

$hide_spammers_checkbox.on("change", async function () {
  chrome.storage.local
    .set({ hide_spammers: $hide_spammers_checkbox.prop("checked") })
    .then(() => {
      // alert("Value is set to " + $show_days.prop("checked"));
    });
});
