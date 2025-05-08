function createAddObserver(targetElement, callback, options = { childList: true }) {
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      mutation.addedNodes.forEach((addedNode) => {
        callback(addedNode);
      });
    });
  });
  observer.observe(targetElement, options);

  return observer;
}

function isValidFilterUrl(...urlFragments) {
  let result = true;

  if (urlFragments) {
    for (let arg of urlFragments) {
      result = result && !window.location.pathname.includes(arg);
    }
  }
  return result;
}

const getNameFromMenu = async (art_id) => {
  if (document.querySelector("#" + art_id + " .uikit-popup-menu") !== null) {
    //desktop
    let el = document.querySelector("#" + art_id + " .uikit-popup-menu");
    await el.querySelector(".button").click();
    let name = await [...el.querySelectorAll(".menu a")].at(-1).text.split("@")[1];
    el.querySelector(".button").click();
    return name;
  }
};
