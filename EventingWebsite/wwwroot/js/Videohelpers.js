// Videohelpers.js
// Safety net for the background loop video - only ever intervenes if the
// video is NOT already playing. Calling play() unconditionally (even on a
// video whose native autoplay already succeeded) was what caused the
// desktop Chrome/Edge frozen-first-frame bug: two competing play requests
// racing against each other disrupted the compositor. Guarding every call
// with `if (video.paused)` means JS never touches a video that's already
// playing, so desktop autoplay is left completely alone, while mobile still
// gets retried if its first attempt didn't take.

export function initVideo(video) {
    if (!video) return;

    const tryPlay = () => {
        if (video.paused) {
            video.play().catch(err => {
                console.warn("Video play() was blocked:", err);
            });
        }
    };

    video.addEventListener("error", () => {
        console.warn("Video failed to load, retrying...");
        video.load();
        tryPlay();
    });

    video.addEventListener("stalled", tryPlay);
    video.addEventListener("suspend", tryPlay);
    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) tryPlay();
    });

    // Single initial check - does nothing if autoplay already has it playing.
    tryPlay();
}