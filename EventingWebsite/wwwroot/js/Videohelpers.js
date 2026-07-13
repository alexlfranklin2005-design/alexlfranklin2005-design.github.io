// videoHelpers.js
// Handles the background loop video entirely outside Blazor's render cycle.

export function initVideo(video) {
    if (!video) return;

    // Chrome/Edge desktop has a known compositor bug: a muted autoplay video
    // can start actually playing (currentTime advancing) while the painted
    // frame stays frozen on frame 1, until something forces a full repaint -
    // which is why switching tabs and back "fixes" it. Nudging the transform
    // by a sub-pixel amount forces Chrome to recomposite this layer, without
    // needing the user to do anything.
    const nudgeRepaint = () => {
        requestAnimationFrame(() => {
            video.style.transform = "translateZ(0.01px)";
            requestAnimationFrame(() => {
                video.style.transform = "translateZ(0)";
            });
        });
    };

    const tryPlay = () => {
        video.play().catch(err => {
            console.warn("Video play() was blocked:", err);
        });
    };

    // Fires once playback genuinely begins - the right moment to nudge.
    video.addEventListener("playing", nudgeRepaint);

    video.addEventListener("error", () => {
        console.warn("Video failed to load, retrying...");
        video.load();
        tryPlay();
    });

    video.addEventListener("stalled", tryPlay);
    video.addEventListener("suspend", () => {
        if (video.paused) tryPlay();
    });

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && video.paused) tryPlay();
    });

    tryPlay();

    // Also nudge shortly after init in case "playing" already fired before
    // this listener was attached (can happen if autoplay wins the race).
    setTimeout(nudgeRepaint, 300);
}