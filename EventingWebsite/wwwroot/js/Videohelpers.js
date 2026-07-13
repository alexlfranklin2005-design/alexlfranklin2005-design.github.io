// videoHelpers.js
// Handles the background loop video entirely outside Blazor's render cycle.
// Blazor never re-touches this element after initVideo runs once on firstRender,
// so autoplay/looping is never interrupted by StateHasChanged() elsewhere in the app.

export function initVideo(video) {
    if (!video) return;

    const tryPlay = () => {
        video.play().catch(err => {
            // Autoplay can be blocked (rare with muted+playsinline, but can happen
            // on some mobile browsers under low-power mode, etc).
            console.warn("Video play() was blocked:", err);
        });
    };

    video.addEventListener("error", () => {
        console.warn("Video failed to load, retrying...");
        video.load();
        tryPlay();
    });

    video.addEventListener("stalled", tryPlay);
    video.addEventListener("suspend", () => {
        // Some mobile browsers suspend loading of background video; nudge it.
        if (video.paused) tryPlay();
    });

    // The browser may not have enough data buffered yet when this script runs
    // (especially on desktop, right after page load). Retry once data/metadata
    // actually becomes available instead of relying on a single early play() call.
    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    // Retry playback when the tab/app regains visibility/focus - this is what
    // was previously "fixing itself" on desktop when switching tabs.
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && video.paused) tryPlay();
    });

    // Explicit first play attempt (more reliable across browsers than relying
    // solely on the autoplay attribute, especially on iOS Safari).
    tryPlay();
}