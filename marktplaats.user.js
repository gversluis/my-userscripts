// ==UserScript==
// @name Verwijder commerciele aanbieders
// @description remove everything with seller link ("Bezoek website")
// @match https://www.marktplaats.nl/*
// @version          1.1
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

let bannedSellers = ["JU&JU"]; // default, some commercial sellers
let removeCrapFlag = 1;
{

  let removeBanners = function() {
    let banners = document.querySelectorAll(".hz-Banner, .hz-Listings__container--cas, .hz-Listings__container--casGallery, #adsense-container");
    for (let banner of banners) {
      console.log("Hide banners", banner);
      banner.style.display = "none";
    }
  };


  let removeCrap = function(bannedSellers) {

    let sellerDeleteAction = function(event) {
      event.stopPropagation();
      event.preventDefault();
      let seller = this.parentElement.querySelector(".hz-Listing-seller-name").innerText;
      if (confirm('Are you sure you want to ban seller ' + seller + "?")) {
        console.log("Ban seller", seller);
        bannedSellers.push(seller);
        GM_setValue("marktplaatsbannedsellers", bannedSellers);
        console.log('banned sellers list', GM_listValues());
        removeCrap(bannedSellers);
      }
    };

    console.log('bannedSellers', bannedSellers);
    removeBanners();

    let items = document.querySelectorAll(".hz-Listing");
    for (let item of items) {
      if (item.innerText.match(/(Bezorgt in|Topadvertentie|Dagtopper|Heel Nederland|Bezoek website|Naar website)/)) {
        console.log("Hide item", item);
        item.style.display = "none";
      }
      // check banned sellers
      let sellers = item.querySelectorAll(".hz-Listing-seller-name, .hz-Listing-seller-name");
      console.log('add delete action', sellers);
      for (let seller of sellers) {
        if (bannedSellers.includes(seller.innerText)) {
          console.log("Hide seller", seller);
          item.style.display = "none";
        } else if (!seller.getAttribute('data-has-delete')) {
          // add ban action
          seller.setAttribute('data-has-delete', "true");
          let sellerDeleteActionElement = document.createElement('div');
          sellerDeleteActionElement.className = 'sellerDeleteAction';
          sellerDeleteActionElement.addEventListener("click", sellerDeleteAction);
          seller.insertAdjacentElement('afterend', sellerDeleteActionElement);
        }
      }
    }

  };


  // incheck if GM does exist in context
  if (typeof GM_getValue !== 'undefined') {
    bannedSellers = GM_getValue("marktplaatsbannedsellers", bannedSellers);
  } else {
    console.log("Run in page context");
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
    if (removeCrapFlag) {
      removeCrap(bannedSellers);
      removeCrapFlag = 0;
    }
  }, 500);

}
