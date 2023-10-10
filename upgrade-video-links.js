// ==UserScript==
// @name             360 to 720
// @match            *://*movies*
// @grant            GM_addStyle
// @version          1.0
// @run-at           document-end
// Use in combination with:
// - Add-on Absolute Enable Right CLick & Copy - Absolute mode
// OR
// - https://greasyfork.org/en/scripts/23772-absolute-enable-right-click-copy/code
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

* {
	-webkit-user-select: text !important;
	-moz-user-select: text !important;
	-ms-user-select: text !important;
	 user-select: text !important;
}


.gbullet {
	position: absolute;
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
.rating {
	right: 25px;
  font-size: 14px;
	width: 22px;
	height: 22px;
}

.imdb-score {
	right: 0px;
}

div[data-quality="itemAbsolute_cam"] img,
div[data-imdb^="IMDb: 0"] p,
div[data-imdb^="IMDb: 1"] p,
div[data-imdb^="IMDb: 2"] p,
div[data-imdb^="IMDb: 3"] p,
div[data-imdb^="IMDb: 4"] p,
div[data-imdb^="IMDb: 5"] p,
div[data-imdb^="IMDb: 0"] img,
div[data-imdb^="IMDb: 1"] img,
div[data-imdb^="IMDb: 2"] img,
div[data-imdb^="IMDb: 3"] img,
div[data-imdb^="IMDb: 4"] img,
div[data-imdb^="IMDb: 5"] img {
  opacity: 0.3;
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

  let fix = function() {
    // /360?name=weird-the-al-yankovic-story_360&
    let video = document.querySelector('video[src*="/360?"]');
    if (video) {
      video.setAttribute('src', video.getAttribute('src').replace(/\/360\?(.*?)_360\&/, "/720?$1_720&"));
    }
    // /480?name=avatar-the-way-of-water_480&
    video = document.querySelector('video[src*="/480?"]');
    if (video) {
      video.setAttribute('src', video.getAttribute('src').replace(/\/480\?(.*?)_480\&/, "/720?$1_720&"));
    }

    let imdbScores = document.querySelectorAll('div[data-imdb]');
    for (let imdbScoreElement of imdbScores) {
      let imdbScore = (imdbScoreElement.getAttribute('data-imdb').match(/\d(.\d)?/) || ['0'])[0];
      let rating = imdbScoreElement.getAttribute('data-rating');
      let displayImdbScore = imdbScoreElement.querySelector('.imdb-score');
      if (!displayImdbScore) {
        imdbScoreElement.querySelector('a').after(
          createElementFromHTML('<div class="gbullet imdb-score">' + imdbScore + '</div>')
        );
        imdbScoreElement.querySelector('a').after(
          createElementFromHTML('<div class="gbullet rating">' + Math.round(rating * 2, 2) + '</div>')
        );
      }
    }
  };

  setInterval(function() {
    if (!document.hidden && fixFlag) {
      fix();
      fixFlag = 0;
    }
  }, 1000);

  const observer = new MutationObserver(function() {
    fixFlag = 1;
  });
  observer.observe(document.querySelector("body"), {
    childList: true,
    subtree: true
  });

}
