export function init(dotNetRef, stageEl, panelEl) {
    let lastCall = 0;
    let startY = 0;
    let lastY = 0;

    // NEW: Variable to track our "cooldown" period
    let scrollLockUntil = 0;

    const handler = {
        processScrollIntent: function (deltaY, e) {
            const now = Date.now();

            // 1. THE FIX: If we are in the cooldown period, absorb the momentum and do nothing
            if (now < scrollLockUntil) {
                if (e.cancelable) {
                    e.preventDefault();
                }
                return;
            }

            const isOpen = panelEl.classList.contains('open');
            const isAtTop = stageEl.scrollTop <= 0;

            // 2. Block native scroll if the panel is NOT open, 
            // OR if it IS open but we are at the very top and trying to scroll up to close it.
            if (!isOpen || (isAtTop && deltaY < 0)) {
                if (e.cancelable) {
                    e.preventDefault();
                }

                // Throttle requests to Blazor to maintain performance
                if (now - lastCall > 50) {

                    // If we are closed and scrolling down (triggering an OPEN)
                    if (!isOpen && deltaY > 0) {
                        scrollLockUntil = now + 800; // Lock scrolling for 800ms
                    }
                    // If we are open and scrolling up at the top (triggering a CLOSE)
                    else if (isOpen && isAtTop && deltaY < 0) {
                        scrollLockUntil = now + 800; // Lock scrolling for 800ms
                    }

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