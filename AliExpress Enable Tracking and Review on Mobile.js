// ==UserScript==
// @name         AliExpress enable tracking/review on mobile site
// @version      0.2
// @description  Replaces the app install popup with a link to the tracking/review page
// @match        *://*.aliexpress.com/p/order/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  document.querySelectorAll('.order-item-btns button').forEach(function(button) {
    if (button.innerText.match('Track order')) {
      console.log('GERBEN TRACK', button);
      button.onclick = function(event) {
        event.preventDefault();
        event.stopPropagation();
        let orderLink = this.closest('a').href; // something like 'https://www.aliexpress.com/p/order/detail.html?spm=a2g0n.order_list.order_list_main.7.LEtTeRsAnDNuMBers&orderId=3041111111111111'
        // tracking link looks like 'https://www.aliexpress.com/p/tracking/index.html?spm=a2g0o.order_list.order_list_main.22.LEtTeRsAnDNuMBers&_addShare=no&_login=yes&tradeOrderId=3041111111111111'
        let trackingLink = orderLink.replace('/order/detail.html','/tracking/index.html').replace('&orderId=', '&tradeOrderId=').replace('&tradeOrderId=', '&_addShare=no&_login=yes&tradeOrderId=');

        window.location = trackingLink;
      };
    }
    
    if (button.innerText.match('Write a review')) {
      console.log('GERBEN REVIEW', button);
      button.onclick = function(event) {
        event.preventDefault();
        event.stopPropagation();
        let orderLink = this.closest('a').href; // something like 'https://www.aliexpress.com/p/order/detail.html?spm=a2g0n.order_list.order_list_main.7.LEtTeRsAnDNuMBers&orderId=3041111111111111'
        // review link looks like 'https://feedback.aliexpress.com/management/leaveFeedback.htm?parentOrderId=3041111111111111'
        let orderId = (orderLink.match(/orderId=(\d+)/)||['',''])[1];
        let trackingLink = 'https://feedback.aliexpress.com/management/leaveFeedback.htm?parentOrderId='+orderId;
        window.location = trackingLink;
      };
    }

  });
})();
