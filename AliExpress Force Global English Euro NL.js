// ==UserScript==
// @name         Aliexpress English
// @version      0.1
// @description  Changes cookies so the language becomes English, currency EURO, location NL
// @match        *://www.aliexpress.com/*
// @match        *://*.aliexpress.com/*
// @match        *://www.aliexpress.ru/*
// @match        *://*.aliexpress.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aliexpress.com
// ==/UserScript==

// adapted from: https://greasyfork.org/en/scripts/447465-fix-com-to-ru-gatewayadapt-glo2rus-aliexpress-redirect-for-ukraine/code
// adapted from: https://gist.github.com/apfelchips/d8a6e08c1aeb79df4372096fd11c1fc1

const FORCE_SITE = 'glo';
const FORCE_REGION = 'NL';
const FORCE_LOCALE = 'en_US';
const FORCE_CURRENCY = 'EUR';

function getCookie(cName) {
    let match = document.cookie.match(new RegExp('(^| )' + cName + '=([^;]+)'));
    if (match) {
        return match[2];
    } else {
        return '';
    }
}

function setCookie(cName, cValue, expDays) {
    let date = new Date();
    date.setTime(date.getTime() + (expDays * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${cName}=${cValue}; ${expires}; path=/`;
}

let aepCookie = getCookie('aep_usuc_f');
let intlCookie = getCookie('intl_locale');
let xmanCookie = getCookie('xman_us_f');

if ( ! intlCookie.includes(`${FORCE_LOCALE}`)) {
    intlCookie = intlCookie.replace(/^[a-z][a-z]_[A-Z][A-Z]$/, FORCE_LOCALE);
    setCookie('intl_locale', FORCE_LOCALE, 9999);
}

if ( ! xmanCookie.includes(`x_locale=${FORCE_LOCALE}`)) {
    const newxmanCookie = xmanCookie.replace(/x_locale=\w{2}_\w{2}/i, `x_locale=${FORCE_LOCALE}`);
    setCookie('xman_us_f', newxmanCookie, 9999);
}

if (!(aepCookie.includes(`site=${FORCE_SITE}`) &&
      aepCookie.includes(`region=${FORCE_REGION}`) &&
      aepCookie.includes(`b_locale=${FORCE_LOCALE}`) &&
      aepCookie.includes(`c_tp=${FORCE_CURRENCY}`)
     )) {
    // isfm=y&site=nld&province=null&city=null&c_tp=EUR&x_alimid=751706159&ups_d=0|0|0|0&isb=y&ups_u_t=1743286016097&region=NL&b_locale=en_US&ae_u_p_s=1
    aepCookie = aepCookie.replace(/&site=[a-z]{3}&/, `&site=${FORCE_SITE}&`);
    aepCookie = aepCookie.replace(/&c_tp=[a-z]{3}&/, `&c_tp=${FORCE_CURRENCY}&`);
    aepCookie = aepCookie.replace(/&region=[a-z]{3}&/, `&region=${FORCE_REGION}&`);
    aepCookie = aepCookie.replace(/&b_locale=[a-z]{3}&/, `&b_locale=${FORCE_LOCALE}&`);
    setCookie('aep_usuc_f', aepCookie, 9999);
    let globalLocation = document.location.href.replace(/\/\/[a-z][a-z]\./, '//www.');
    globalLocation = globalLocation.replace(/gatewayAdapt=glo2[a-z]{3}&?/, '');
    document.location.href = globalLocation;
}
