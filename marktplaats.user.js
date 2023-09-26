// ==UserScript==
// @name Verwijder commerciele aanbieders
// @description remove everything with seller link ("Bezoek website")
// @match https://www.marktplaats.nl/*
// @version          2.0
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// ==/UserScript==

if (typeof GM_addStyle === 'undefined') {
  var GM_addStyle = function(css) {
    const head = document.querySelector('head');
    if (head) {
      const style = document.createElement('style');
      style.textContent = css;
      head.appendChild(style);
    }
  };
}

GM_addStyle(`
      .sellerDeleteAction::before {
          display: inline-block;
          content: "☠";
          font-size: 10mm;
          margin-left: 10px;
      }
      .hz-Listing--list-item .hz-Listing--sellerInfo,
      .hz-Listing-seller-name-container {
          display: inline-block;
          text-align: right;
      }
      .hz-Listing-seller-name-container .hz-Link {
          float: right;
      }
      /* distraction from the page for why you came there in the first place */
      #homepage-root {
          display: none;
      }
      /* fix response model dialog being wider than the viewing port, wonder why they did not discover this bug themselves */
      @media (min-width: 480px) {
        .ReactModalPortal,
        .hz-Modal--m {
          width: 90vw !important;
          min-width: 90vw !important;
          max-width: 90vw !important;
          overflow: auto;
        }
      }

`);

{
  const debug = false;
  let bannedSellers = []; // default, some commercial sellers
  let removeCrapFlag = 1;
  let removeCrap = function() {}; // redefined later

  let removeBanners = function() {
    let banners = document.querySelectorAll(".hz-Banner, .hz-Listings__container--cas, .hz-Listings__container--casGallery, #adsense-container");
    for (let banner of banners) {
      if (debug) {
        console.log("Hide banners", banner);
      }
      banner.style.display = "none";
    }
  };

  let getBannedName = function(item) {
      let sellerElement = item.querySelector('.hz-Listing-seller-name-container>a');
      let sellerName = sellerElement.innerText;
      let sellerLocation = item.querySelector('.hz-Listing--sellerInfo .hz-Listing-distance-label').innerText;
      // should use the sellerId but marktplaats does a lot of work to hide it. The chance that people have the same name and location is small enough
      return sellerName+"::"+sellerLocation; // not a good way but it is fast :) and their location is acceptable
  };
  
  let sellerDeleteAction = function(event) {
    event.stopPropagation();
    event.preventDefault();
    let item = this.closest(".hz-Listing");
    let bannedName = getBannedName(item);
    if (debug) {
      console.log("Ban seller?", bannedName);
    }
    if (confirm('Are you sure you want to ban seller ' + bannedName + "?")) {
      bannedSellers.push(bannedName);
      GM_setValue("marktplaatsbannedsellers", bannedSellers);
      if (debug) {
        console.log('banned sellers list', GM_listValues());
      }
      removeCrap(bannedSellers);
    }
  };

  removeCrap = function(bannedSellers) {
    if (debug) {
      console.log('removeCrap, bannedSellers', bannedSellers);
    }
    removeBanners();

    let items = document.querySelectorAll(".hz-Listing");
    for (let item of items) {
      if (item.innerText.match(/(Bezorgt in|Topadvertentie|Dagtopper|Heel Nederland|Bezoek website|Naar website|huur|Gevraagd|Gezocht)/i)) {
        if (debug) {
          console.log("Hide item", item);
        }
        item.style.display = "none";
      }
      // check banned sellers
      let bannedName = getBannedName(item);
      if (bannedSellers.includes(bannedName)) {
        if (debug) {
          console.log("Hide seller", sellerName);
        }
        item.style.display = "none";
      }
      // add ban action
      if (!item.getAttribute('data-has-delete')) {
        item.setAttribute('data-has-delete', "true");
        let sellerDeleteActionElement = document.createElement('div');
        sellerDeleteActionElement.className = 'sellerDeleteAction';
        sellerDeleteActionElement.addEventListener("click", sellerDeleteAction);
        let sellerElement = item.querySelector('.hz-Listing-seller-name-container>a');
        sellerElement.appendChild(sellerDeleteActionElement);
      }
    }

  };

  // check if GM does exist in context (does not exist in page context when run is clicked)
  if (typeof GM_getValue !== 'undefined') {
    bannedSellers = GM_getValue("marktplaatsbannedsellers", bannedSellers);
  }
  // monitor future changes
  const observer = new MutationObserver(function() {
    removeCrapFlag = 1;
  });
  observer.observe(document.querySelector("body"), {
    childList: true,
    subtree: true
  });

  setInterval(function() {
    if (!document.hidden && removeCrapFlag) {
      removeCrap(bannedSellers);
      removeCrapFlag = 0;
    }
  }, 500);

}
