// ==UserScript==
// @name Marktplaats Verwijder commerciele aanbieders
// @description remove everything with seller link ("Bezoek website")
// @match https://www.marktplaats.nl/*
// @version          3.7
// @run-at           document-start
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// ==/UserScript==

let listings = [];
{
  const debug = true;
  let bannedSellers = []; // default, some commercial sellers
  let removeCrapFlag = 1;
  let removeCrap = function() {}; // redefined later

  const proxyFetch = {
    apply(actualFetch, that, args) {
      // Forward function call to the original fetch
      const result = Reflect.apply(actualFetch, that, args);
      result.then((response) => {
        let clone = response.clone();
        if (debug) {
          console.log("FETCH", args, clone);
        }
        if (args[0].startsWith("/lrp/api/search?")) {
          clone.json().then((json) => {
            listings = json.listings;
            listings.forEach(listing => listing.img = ((listing.pictures || [])[0] || { url: '' }).url.split('$')[0]);
            console.log('listings', listings);
          });
        }
        return response;
      });
      return result;
    },
  };
  if (typeof(unsafeWindow) !== 'undefined') {
  	unsafeWindow.fetch = exportFunction(new Proxy(window.fetch, proxyFetch), unsafeWindow);
  }

  let removeBanners = function() {
    let banners = document.querySelectorAll(".hz-Banner, .hz-Listings__container--cas, .hz-Listings__container--casGallery, #adsense-container");
    for (let banner of banners) {
      if (debug) {
        console.log("Hide banners", banner);
      }
      banner.style.display = "none";
    }
  };

  let getListingId = function(item) {
    if (!item.getAttribute('data-listing-id')) {
      let imgElement = item.querySelector("img");
      if (imgElement) {
        let img = imgElement.getAttribute("src");
        listings.forEach((listing, nr) => {
          if (listing.pictures && img.startsWith(listing.img)) {
            item.setAttribute('data-listing-id', nr);
          }
        });
      } else {
        let sellerName = item.querySelector(".hz-Listing-sellerInfo a")?.innerText;
        if (debug) {
          console.log("Seller name", sellerName);
        }
        listings.forEach((listing, nr) => {
          if (!listing.pictures && listing.sellerInformation.sellerName === sellerName) {
            item.setAttribute('data-listing-id', nr);
          }
        });
      }
    }
    return item.getAttribute('data-listing-id');
  };

  let getBannedName = function(item) {
    let listingId = getListingId(item);
    // let seller = item.querySelector(".hz-Listing-seller-name").innerText;
    if (debug) {
      console.log('Listing match', listingId, listings[listingId], item);
    }
    let listing = listings[listingId];
    if (listing && listing.sellerInformation) {
      return listing.sellerInformation.sellerId;
    } else {
      let sellerId = null;
      getSellerAnchors(item).forEach(e => {
        let id = (e.href.match(/\/([0-9]+)\/$/)||[])[1];
        if (id) {
          sellerId = Number.parseInt(id);
        }
      });
      if (sellerId) {
        return sellerId;
      }
      console.log("DID NOT FOUND MATCH", listings, item);
    }
    return null;
  };

  let sellerDeleteAction = function(event) {
    event.stopPropagation();
    event.preventDefault();
    let item = this.closest(".hz-Listing");
    let bannedName = getBannedName(item);
    if (debug) {
      console.log("Ban seller?", bannedName);
    }
    if (bannedName) {
      if (confirm('Are you sure you want to ban seller ' + bannedName + "?")) {
        bannedSellers.push(bannedName);
        GM_setValue("marktplaatsbannedsellers", bannedSellers);
        if (debug) {
          console.log('banned sellers list', GM_listValues());
        }
      }
      removeCrap(bannedSellers);
    } else {
      alert('Banned name was null?');
    }
  };

  let getSellerAnchors = function(item) {
		return [...item.querySelectorAll(".hz-Listing-sellerInfo a, .hz-Listing-sellerInfoPriority a")];
  };
  
  removeCrap = function(bannedSellers) {
    if (debug) {
      console.log('removeCrap, bannedSellers', bannedSellers);
    }

    removeBanners();

    if (!listings.length) {
      listings = JSON.parse(document.getElementById('__NEXT_DATA__')?.innerText)?.props?.pageProps?.searchRequestAndResponse?.listings;
      listings.forEach(listing => listing.img = ((listing.pictures || [])[0] || { url: '' }).url.split('$')[0]);
      console.log('listings', listings);
    }
    
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
        //if (debug) {
          console.log("Hide seller", bannedName);
        //}
        item.style.display = "none";
      }

      let sellerElements = getSellerAnchors(item);
      console.warn("Found sellerElements", sellerElements, item);
      if (!item.getAttribute('data-has-delete')) {

        sellerElements.forEach(sellerElement => {
          let sellerDeleteActionElement = document.createElement('div');
          sellerDeleteActionElement.className = 'sellerDeleteAction';
          sellerDeleteActionElement.addEventListener("click", sellerDeleteAction);
          sellerDeleteActionElement.innerText = "💀";
          sellerElement.appendChild(sellerDeleteActionElement);
          item.setAttribute('data-has-delete', "true");
        });
      }
    }
  };

  // check if GM does exist in context (does not exist in page context when run is clicked)
  if (typeof GM_getValue !== 'undefined') {
    bannedSellers = GM_getValue("marktplaatsbannedsellers", bannedSellers);
  }
  let ignoreUser = window.location.pathname.startsWith("/u");
  addEventListener("load", () => {
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
        removeCrap(ignoreUser ? [] : bannedSellers);
        removeCrapFlag = 0;
      }
    }, 500);
  });
}



let addStyle = function(css) {
  const head = document.querySelector('head');
  if (head) {
    const style = document.createElement('style');
    style.textContent = css;
    head.appendChild(style);
  }
};

addStyle(`

			.sellerDeleteAction {
      	font-size: 8mm;
      }

      /* show seller name and delete action on mobile */
      html body .hz-Listing--list-item .hz-Listing--sellerInfo,
      html body .hz-Listing-seller-name-container {
          display: inline-block;
          text-align: right;
      }
      /* we do not need the other distance anymore since it is included with the seller info */
      html body .hz-Listing--list-item .hz-Listing-group--mobile-bottom-row {
          display: none;
      }
      .hz-Listing-seller-name-container .hz-Link {
          float: right;
      }
      .hz-Listing-seller-name {
          max-width: 100px;
          white-space: break-spaces;
          word-wrap: anywhere;
      }
      /* distraction from the page for why you came there in the first place */
      #homepage-root {
          display: none;
      }

      /* I'm not sure what they did with the selectbox but here the colors are white on lightgrey so lets fix that */
      select option {
      	color: #ccc !important;
        background: #333 !important;
      }

      /* I'm here for the board games, now lets hope they won't change category id's */
      select option[value="1233"],
      select option[value="2743"],
      select option[value="2744"] {
      	font-weight: bolder;
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
