// ==UserScript==
// @name         Temu popup remover
// @version      0.1
// @description  Closes temu popups
// @match        *://*.temu.com/
// @match        *://*.temu.com/?*
// @run-at       document_end
// ==/UserScript==


(function () {
  const clickSelectors = [
    'div[id^="modal_id_"] svg[class^="close-"]',
    '.loadable-container:not(:has(#reviewContent)) [role="dialog"] [aria-label="close"]'
  ];


	let removeCrapFlag = 1;
  let removeCrap = function() {
    clickSelectors.forEach(function(clickSelector) {
			let clickElement = document.querySelector(clickSelector)?.dispatchEvent(new MouseEvent("click", {view:window, bubbles:true, cancelable:true}));
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
