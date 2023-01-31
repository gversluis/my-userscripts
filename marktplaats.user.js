// ==UserScript==
// @name Verwijder commerciele aanbieders
// @description remove everything with promoted link
// @match https://www.marktplaats.nl/*
// @version          1.1
// ==/UserScript==

{
  var removeCrap = function() {
    console.log("RemoveCrap");
    let banners = document.querySelectorAll(".hz-Banner, .hz-Listings__container--cas, .hz-Listings__container--casGallery, #adsense-container");
    for (let banner of banners) {
      console.log("Hide crap", banner);
      banner.style.display="none";
    }

    let items = document.querySelectorAll(".hz-Listing");
    for (let item of items) {
      if (item.innerText.match(/(Bezorgt in|Topadvertentie|Dagtopper|Heel Nederland|Bezoek website|Naar website)/)) {
       console.log("Hide crap", item);
       item.style.display="none";
      }
    }

  }

  const observer = new MutationObserver(removeCrap);
  observer.observe(document.querySelector("body"), { childList: true, subtree: true });
  removeCrap();
}