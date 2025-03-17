// ==UserScript==
// @name         AliExpress view more
// @version      0.1
// @description  Automatically clicks view more to expand product description and specifications
// @match        *://*.aliexpress.com/item/*
// @run-at       document-end
// ==/UserScript==


(function() {
  const clickSelectors = [
    '#nav-description div[class*="extend-"]>button',
    '#nav-specification>button'
  ];


  let removeCrapFlag = 1;
  let removeCrap = function() {
    clickSelectors.forEach(function(clickSelector) {
      document.querySelector(clickSelector)?.dispatchEvent(new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true
      }));
    });
  };

  addEventListener("load", () => {
    // monitor future changes
    const observer = new MutationObserver(function() {
      console.log('GERBEN: REMOVE CRAP');
      removeCrapFlag = 1;
    });
    observer.observe(document.querySelector("body"), {
      childList: true,
      subtree: true
    });

    setInterval(function() {
      if (!document.hidden && removeCrapFlag) {
        removeCrap();
        removeCrapFlag = 0;
      }
    }, 500);
  });
})();
