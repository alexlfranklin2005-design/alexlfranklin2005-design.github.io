export function playVideo(videoEl) {
    if (!videoEl) return;
    videoEl.muted = true;
    videoEl.play().catch(() => { /* autoplay blocked: poster stays visible */ });
}

export function init(dotNetRef, stageEl, panelEl) {
    let lastCall = 0;
    let startY = 0;
    let lastY = 0;

    const handler = {
        processScrollIntent: function (deltaY, e) {
            const isOpen = panelEl.classList.contains('open');

            // stageEl is the element that actually scrolls now (the banner
            // scrolls away with the page), so check its scroll position -
            // panelEl no longer scrolls internally once open.
            const isAtTop = stageEl.scrollTop <= 0;

            // Block native scroll if the panel is NOT open, 
            // OR if it IS open but we are at the very top and trying to scroll up to close it.
            if (!isOpen || (isAtTop && deltaY < 0)) {
                if (e.cancelable) {
                    e.preventDefault();
                }

                // Throttle requests to Blazor to maintain 60fps performance
                const now = Date.now();
                if (now - lastCall > 20) {
                    dotNetRef.invokeMethodAsync('OnWheelDelta', deltaY);
                    lastCall = now;
                }
            }
        },
        handleWheel: function (e) {
            handler.processScrollIntent(e.deltaY, e);
        },
        handleTouchStart: function (e) {
            startY = e.touches[0].clientY;
            lastY = startY;
        },
        handleTouchMove: function (e) {
            const currentY = e.touches[0].clientY;
            const deltaY = lastY - currentY; // Positive = scrolling down
            lastY = currentY;
            handler.processScrollIntent(deltaY, e);
        },
        resetScroll: function () {
            // stageEl is the real scroll container now.
            stageEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // passive: false is required to allow us to use e.preventDefault()
    stageEl.addEventListener('wheel', handler.handleWheel, { passive: false });
    stageEl.addEventListener('touchstart', handler.handleTouchStart, { passive: true });
    stageEl.addEventListener('touchmove', handler.handleTouchMove, { passive: false });

    return {
        dispose: () => {
            stageEl.removeEventListener('wheel', handler.handleWheel);
            stageEl.removeEventListener('touchstart', handler.handleTouchStart);
            stageEl.removeEventListener('touchmove', handler.handleTouchMove);
        },
        resetScroll: handler.resetScroll
    };
}