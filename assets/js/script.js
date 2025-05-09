const getNameFromMenu = async (art_id) => {
  if (document.querySelector("#" + art_id + " .uikit-popup-menu") !== null) {
    //desktop
    let el = document.querySelector("#" + art_id + " .uikit-popup-menu");
    await el.querySelector(".button").click();
    let name = await [...el.querySelectorAll(".menu a")]
      .at(-1)
      .text.split("@")[1];
    el.querySelector(".button").click();
    return name;
  }
};
