// Shows the full-page loading overlay (styled in Components/Layout/MainLayout.razor.css)
// while a page is loading, then reveals the page once its images are ready.
(function () {
    "use strict";

    var root = document.documentElement;
    var LOADING_CLASS = "is-page-loading";
    var MAX_WAIT_MS = 6000;
    var latestRun = 0;

    function showLoader() {
        latestRun++; // cancels any hide that is still waiting
        root.classList.add(LOADING_CLASS);
    }

    // Images that still matter: anything not loaded yet, except lazy images far below the fold.
    function imagesStillLoading() {
        var images = document.querySelectorAll(".content-area img");
        return Array.prototype.filter.call(images, function (img) {
            if (img.complete) { return false; }
            var farBelowFold = img.loading === "lazy" &&
                img.getBoundingClientRect().top > window.innerHeight * 1.5;
            return !farBelowFold;
        });
    }

    function whenImagesReady() {
        var loads = imagesStillLoading().map(function (img) {
            return new Promise(function (resolve) {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
            });
        });
        var timeout = new Promise(function (resolve) { setTimeout(resolve, MAX_WAIT_MS); });
        return Promise.race([Promise.all(loads), timeout]);
    }

    function hideLoaderWhenReady() {
        var thisRun = ++latestRun;
        requestAnimationFrame(function () {
            whenImagesReady().then(function () {
                if (thisRun === latestRun) {
                    root.classList.remove(LOADING_CLASS);
                }
            });
        });
    }

    // First load
    hideLoaderWhenReady();

    // Moving between pages without a full reload
    try {
        if (window.Blazor && typeof window.Blazor.addEventListener === "function") {
            window.Blazor.addEventListener("enhancednavigationstart", showLoader);
            window.Blazor.addEventListener("enhancednavigationend", hideLoaderWhenReady);
            window.Blazor.addEventListener("enhancedload", hideLoaderWhenReady);
        }
    } catch (e) { /* the overlay is only a nicety; never break the page */ }

    // Back/forward cache: never restore a page that is stuck on the overlay
    window.addEventListener("pageshow", function (event) {
        if (event.persisted) { hideLoaderWhenReady(); }
    });
})();