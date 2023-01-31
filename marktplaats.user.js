// ==UserScript==
// @name Verwijder commerciele aanbieders
// @description remove everything with seller link ("Bezoek website")
// @match https://www.marktplaats.nl/*
// @version          1.0
// @ require        https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.2/waitForKeyElements.js
// ==/UserScript==
/* g lobals waitForKeyElements */

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
  // Start observing the target node for configured mutations
  observer.observe(document.querySelector("body"), { childList: true, subtree: true });
  removeCrap();
}