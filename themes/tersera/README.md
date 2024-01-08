# Base theme for TerSera websites

This theme is largely unstyled, but provides the basis for implementing individual websites in a subtheme (e.g., "/themes/xermelo"). Global components such as the header, ISI tray, and modals, as well as the overall CSS layout, are included here. Fonts, colors, and other site-specific styles and components should be defined in the subtheme.

Note: files located in the "css/global" and "js/global" directories are intended to be duplicated in subthemes as needed.

## Manual setup (this will be handled automatically if using Docker)

This theme was developed using Node.js v16.13.2.

1. In a command prompt, navigate into this theme directory.
2. Run `npm install` to install NPM packages
3. Run `npx gulp` to compile the theme's SASS and Javascript
4. The task `npx gulp watch` is provided to compile SASS and Javascript as files in this theme are modified

## Bookmarklet for displaying grid overlay

The following bookmarklet may be used to test the site's layout by displaying the grid system in an overlay. To use this, paste the following into a bookmark as its URL, then visit that bookmark to display the grid. It's useful to place this bookmark in an easy-to-reach location, such as in a browser's bookmark toobar.

Once displayed, the ` key will toggle the grid on and off.

```
javascript:(function(){var overlay=document.getElementById("cl-grid-overlay");if(overlay){console.log("Grid overlay already installed");return}var style=document.createElement("style");style.innerText="#cl-grid-overlay{position:fixed;top:0;left:0;width:100%;min-width:320px;height:100vh;padding:0;opacity:.25;z-index:9998;pointer-events:none}#cl-grid-overlay>div{display:grid;grid-template-columns:3rem%201fr%20repeat(3,%201fr%202rem%201fr)%201fr%203rem;width:100%;max-width:1344px;height:100vh;margin:0%20auto}@media(min-width:%20768px){#cl-grid-overlay>div{display:grid;grid-template-columns:2rem%201fr%20repeat(11,%201fr%204rem%201fr)%201fr%202rem}}@media(min-width:%20768px){#cl-grid-overlay>div.cl-grid-overlay-small-only{display:none}}#cl-grid-overlay>div.cl-grid-overlay-large-only{display:none}@media(min-width:%20768px){#cl-grid-overlay>div.cl-grid-overlay-large-only{display:grid}}#cl-grid-overlay>div>div{height:100vh;background-color:hotpink}#cl-grid-overlay>div>div:nth-of-type(1){grid-column-start:2;grid-column-end:4}#cl-grid-overlay>div>div:nth-of-type(2){grid-column-start:5;grid-column-end:7}#cl-grid-overlay>div>div:nth-of-type(3){grid-column-start:8;grid-column-end:10}#cl-grid-overlay>div>div:nth-of-type(4){grid-column-start:11;grid-column-end:13}#cl-grid-overlay>div>div:nth-of-type(5){grid-column-start:14;grid-column-end:16}#cl-grid-overlay>div>div:nth-of-type(6){grid-column-start:17;grid-column-end:19}#cl-grid-overlay>div>div:nth-of-type(7){grid-column-start:20;grid-column-end:22}#cl-grid-overlay>div>div:nth-of-type(8){grid-column-start:23;grid-column-end:25}#cl-grid-overlay>div>div:nth-of-type(9){grid-column-start:26;grid-column-end:28}#cl-grid-overlay>div>div:nth-of-type(10){grid-column-start:29;grid-column-end:31}#cl-grid-overlay>div>div:nth-of-type(11){grid-column-start:32;grid-column-end:34}#cl-grid-overlay>div>div:nth-of-type(12){grid-column-start:35;grid-column-end:37}";document.body.appendChild(style);overlay=document.createElement("div");overlay.id="cl-grid-overlay";overlay.innerHTML="\n%20%20%20%20%20%20%20%20<div%20class=\"cl-grid-overlay-small-only\">\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20</div>\n\n%20%20%20%20%20%20%20%20<div%20class=\"cl-grid-overlay-large-only\">\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20%20%20%20%20<div></div>\n%20%20%20%20%20%20%20%20</div>\n%20%20%20%20</div>";document.body.appendChild(overlay);var%20overlayVisible=true;window.addEventListener("keypress",function(event){if(event.key=="`"){if(overlayVisible)overlay.style.display="none";else%20overlay.removeAttribute("style");overlayVisible=!overlayVisible}});console.log("Grid%20overlay%20installed%20-%20press%20`%20to%20toggle")})();
```