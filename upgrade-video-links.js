// ==UserScript==
// @name             360 to 720
// @match            *://*movies*
// @grant            GM_addStyle
// @version          2.2
// @run-at           document-end
// Use in combination with:
// - Add-on Absolute Enable Right CLick & Copy - Absolute mode
// OR
// - https://greasyfork.org/en/scripts/23772-absolute-enable-right-click-copy/code
// ==/UserScript==
let targetResolutions = [720, 1080, 480, 360];
let testElementId = 'video-test';
let testElementErrorId = 'video-test-error';
let downloadElementId = 'video-download-link';

if (typeof GM_addStyle === 'undefined') {
  let GM_addStyle = function(css) {
    const head = document.querySelector('head');
    if (head) {
      const style = document.createElement('style');
      style.textContent = css;
      head.appendChild(style);
    }
  };
}

GM_addStyle(`

* {
	-webkit-user-select: text !important;
	-moz-user-select: text !important;
	-ms-user-select: text !important;
	 user-select: text !important;
}

#video-test {
  display: block;
  width: 1px;
  height: 1px;
}

#video-test-error {
  display: block;
  background: orange;
  color: black;
  text-align: center;
  padding: 10px;
}

#video-download-link {
  display: block;
  background: blue;
  text-align: center;
  text-decoration: underline;
}

#video-download-link a {
  display: inline-block;
  color: white !important;
  padding: 10px;
}

.imdb-score {
	position: absolute;
	right: 0px;
	background-color: #fff;
	color: #000;
	border-radius: 50%;
	width: 25px;
	height: 25px;
	margin-top: 10px;
	margin-right: 10px;
	padding-top: 5px;
	text-align: center;
}
`);


{
  let fixFlag = 1;

  let createElementFromHTML = function(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild;
  };

  let showDownloadLink = function(url, resolution, ext = '.mp4') {
    let downloadElement = document.getElementById(downloadElementId);
    if (!downloadElement) {
      downloadElement = document.createElement('div');
      downloadElement.id = downloadElementId;
      document.body.insertBefore(downloadElement, document.body.firstChild);
    }
    let filename = document.querySelector('.breadcrumb .active').innerText + ext;
    let season = document.querySelector('.breadcrumb a[href*="season"]');
    if (season) filename = season.innerText + filename;
    filename = filename.replace(/(?:- )?Season ?(\d+)/i, 's$1'); // short version
    filename = filename.replace(/Episode ?(\d+):?/i, 'e$1'); // short version
    filename = '"' + filename.replace(/[^a-zA-Z0-9 \,\.\-_\(\)\$]/g, '-') + '"'; // only safe characters
    filename = filename.replace(/([^a-zA-Z][se])(\d)([e ])/, '$10$2$3'); // prepend zero on season/episode to make it at least 2 digits
    let paragraph = document.createElement('p');
    paragraph.innerHTML = '<a download="' + filename + '" href="' + url + '">' + filename + ' (' + resolution + ')</a>';
    downloadElement.appendChild(paragraph);
    let button = document.createElement('button');
    button.innerText = '📋 ';
    button.className = 'clipboard';
    button.onclick = function() {
      console.log('Copy to clipboard');
      if (ext === '.mp4') {
        navigator.clipboard.writeText("yt-dlp \"" + url + "\" -o " + filename);
      } else {
        navigator.clipboard.writeText("wget \"" + url + "\" -O " + filename);
      }
    };
    downloadElement.appendChild(button);
  };

  let addError = function(html) {
    let errorElement = document.getElementById(testElementErrorId);
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = testElementErrorId;
      document.body.insertBefore(errorElement, document.body.firstChild);
    }
    errorElement.innerHTML += html;
  };

  let upgradeResolutionIfPossible = function(observer, targetResolutionsIndex) {
    if (!targetResolutionsIndex) {
      targetResolutionsIndex = 0;
    }
    console.log('Trying to upgrade video to ', targetResolutionsIndex, targetResolutions[targetResolutionsIndex], targetResolutions);
    // /360?name=big-buck-bunny_360&
    // /480?name=big-buck-bunny_480&
    let video = document.querySelector('video[src*="/360?"],video[src*="/480?"]');
    if (video) {
      observer.disconnect();
      let oldUrl = video.getAttribute('src');
      let newUrl = oldUrl.replace(/\/(\d{3,})\?(.*?)_(\d{3,})\&/, "/" + targetResolutions[targetResolutionsIndex] + "?$2_" + targetResolutions[targetResolutionsIndex] + "&");
      let testElement = document.getElementById(testElementId);
      if (!testElement) {
        testElement = document.createElement('video');
        testElement.id = testElementId;
        testElement.setAttribute('preload', 'metadata');
        testElement.onerror = function(e) {
          console.log("EVENT: ERROR", e);
          addError('<p>Could not load resolution ' + targetResolutions[targetResolutionsIndex]);
          if (++targetResolutionsIndex < targetResolutions.length) {
            // try next preferred resolution
            testElement.remove();
            addError('<p>Trying next resolution ' + targetResolutions[targetResolutionsIndex] + '...<br>');
            upgradeResolutionIfPossible(observer, targetResolutionsIndex);
          } else {
            testElement.remove();
            addError('<p>Found no other resolutions.<br>');
            showDownloadLink(oldUrl, 'original');
          }

        };
        testElement.oncanplay = function(e) {
          console.log("EVENT: CAN PLAY", e);
          video.setAttribute('src', newUrl);
          showDownloadLink(newUrl, targetResolutions[targetResolutionsIndex]);
        };
        testElement.onloadedmetadata = function(e) {
          console.log("EVENT: LOADED META DATA", e);
          video.setAttribute('src', newUrl);
          showDownloadLink(newUrl, targetResolutions[targetResolutionsIndex]);
        };
        document.body.appendChild(testElement);
      }
      if (!testElement.error) {
        testElement.src = newUrl;
      }
    }

  };

  let fixImdbScores = function() {
    let imdbScores = document.querySelectorAll('div[data-imdb]');
    for (let imdbScoreElement of imdbScores) {
      let imdbScore = (imdbScoreElement.getAttribute('data-imdb').match(/\d(.\d)?/) || ['0'])[0];

      let displayImdbScore = imdbScoreElement.querySelector('.imdb-score');
      if (!displayImdbScore) {
        imdbScoreElement.querySelector('a').after(
          createElementFromHTML('<div class="imdb-score">' + imdbScore + '</div>')
        );
      }

      if (imdbScore < 6) {
        imdbScoreElement.querySelector('img').style.opacity = 0.3;
      }
    }
  };

  let getSubtitles = function() {
    // let url = (document.body.innerHTML.match(/http.*\.srt/)||[''])[0];
    // console.log("LOOKING FOR SUBS", url);
    // if ("subtitles" in window) { // most of the time not executed yet :((
    if (!document.querySelector('#' + downloadElementId + ' [href*=".srt"]')) {
      for (let i = 0; i < document.scripts.length; i++) {
        let match = document.scripts[i].innerText.match(/^window.subtitles\s*=\s*(.*)/);
        if (match) {
          let subtitles = JSON.parse(match[1]);
          console.log("FOUND SUBS", subtitles);
          subtitles.forEach(subtitle => showDownloadLink(subtitle.src, 'Subtitle ' + (subtitle.label || subtitle.lang), '.srt'));
        }
      }
    }
  };

  let dimLowQuality = function() {
    let lowQualities = document.querySelectorAll('div[data-quality="itemAbsolute_cam"]');
    for (let lowQuality of lowQualities) {
      lowQuality.querySelector('img').style.opacity = 0.3;
    }
  };

  let fix = function(observer) {
    upgradeResolutionIfPossible(observer);
    getSubtitles();
    fixImdbScores();
    dimLowQuality();
  };

  const observer = new MutationObserver(function() {
    fixFlag = 1;
  });
  observer.observe(document.querySelector("body"), {
    childList: true,
    subtree: true
  });

  setInterval(function() {
    if (!document.hidden && fixFlag) {
      fix(observer);
      fixFlag = 0;
    }
  }, 1000);

}
