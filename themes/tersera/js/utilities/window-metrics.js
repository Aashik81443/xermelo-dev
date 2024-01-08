const settings = {
    // Responsive breakpoints
    breakpoints: {
        small: 0,
        medium: 768,
        large: 960,
        extraLarge: 1200,
        largeWithMargins: 1344,
    },
};

const sortedBreakpoints = [];
let lastBreakpoint = null;
let currentBreakpoint = null;
const breakpointChangeCallbacks = [];

const updateWindowMetrics = () => {
    // Update the current responsive breakpoint
    lastBreakpoint = currentBreakpoint;
    for (let i = 0; i < sortedBreakpoints.length; i++) {
        const breakpoint = sortedBreakpoints[i];

        if (window.matchMedia('(min-width: ' + breakpoint + 'px)').matches) {
            currentBreakpoint = breakpoint;
            break;
        }
    }

    // Check if the breakpoint has changed
    if (lastBreakpoint !== currentBreakpoint && lastBreakpoint !== null) {
        // Determine if we're crossing the mobile-desktop threshold
        let mobileDesktopTransition = false;
        if (WindowMetrics.isMobile(lastBreakpoint)) {
            mobileDesktopTransition = !WindowMetrics.isMobile();
        } else {
            mobileDesktopTransition = WindowMetrics.isMobile();
        }

        // Execute breakpoint change callbacks
        for (let i = 0; i < breakpointChangeCallbacks.length; i++) {
            breakpointChangeCallbacks[i](mobileDesktopTransition);
        }
    }
};

// Initialize the sorted breakpoint array
for (const breakpointName in settings.breakpoints) {
    if (breakpointName) {
        sortedBreakpoints.push(settings.breakpoints[breakpointName]);
    }
}

sortedBreakpoints.sort((a, b) => {
    return b - a;
});

// Setup resize callback
window.addEventListener('resize', updateWindowMetrics);
updateWindowMetrics();

/** Encapsulates methods for determining the current responsive breakpoint */
export default class WindowMetrics {
    /**
     * Exposes the "settings.breakpoints" value for use in other modules
     * */
    static get breakpoints() {
        return settings.breakpoints;
    }

    /**
     * Exposes the "lastBreakpoint" value for use in other modules
     * */
    static get lastBreakpoint() {
        return lastBreakpoint;
    }

    /**
     * Exposes the "currentBreakpoint" value for use in other modules
     * */
    static get currentBreakpoint() {
        return currentBreakpoint;
    }

    /**
     * Determines if we're in a mobile breakpoint
     * @param {number} breakpointToTest A specific value to test (optional)
     * @return {boolean} Whether the current or specified breakpoint is
     *  considered to be a mobile breakpoint
     * */
    static isMobile(breakpointToTest) {
        if (typeof breakpointToTest == 'number') {
            return breakpointToTest <= settings.breakpoints.small;
        } else {
            return currentBreakpoint <= settings.breakpoints.small;
        }
    }

    /**
     * Establishes a callback method to be called whenever a change
     * in the current breakpoint is detected
     * @param {Function} callback The callback to install
     * */
    static addBeakpointChangeCallback(callback) {
        breakpointChangeCallbacks.push(callback);
    }
};
