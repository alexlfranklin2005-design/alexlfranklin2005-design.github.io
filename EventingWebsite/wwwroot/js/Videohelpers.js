export function initVideo(video) {
    if (!video) return;

    // 1. Explicitly ensure the video is muted via JS. 
    // Browsers often require this for programmatic play to succeed.
    video.muted = true;

    const tryPlay = async () => {
        if (video.paused) {
            // 1. Explicitly show the browser the video is muted
            video.defaultMuted = true;
            video.muted = true;

            // 2. Explicitly set playsinline (crucial for iOS/Mobile Safari)
            video.playsInline = true;

            try {
                await video.play();
            } catch (err) {
                if (err.name !== 'NotAllowedError') {
                    console.warn("Video play issue:", err);
                }
            }
        }
    };

    // 2. Initial attempt. If native autoplay worked, this does nothing.
    // If it fails, the catch block above silences the console error.
    tryPlay();

    // 3. The crucial fix: Wait for a user gesture to trigger play.
    const playOnInteract = () => {
        tryPlay();
        // Clean up listeners once the video is successfully playing
        ['click', 'touchstart', 'scroll'].forEach(evt => {
            document.removeEventListener(evt, playOnInteract);
        });
    };

    // Attach lightweight listeners for the first user interaction
    ['click', 'touchstart', 'scroll'].forEach(evt => {
        document.addEventListener(evt, playOnInteract, { once: true });
    });

    // 4. Handle visibility changes (e.g., user switches tabs and comes back)
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) tryPlay();
    });

    // 5. Keep the error fallback just in case the source drops
    video.addEventListener("error", () => {
        console.warn("Video failed to load, retrying...");
        video.load();
        tryPlay();
    });
}