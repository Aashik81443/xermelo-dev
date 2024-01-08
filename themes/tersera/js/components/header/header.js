import {trimValue} from '../../utilities/utilities';
import WindowMetrics from '../../utilities/window-metrics';

// Components
import Nav from './nav';
import Hamburger from './hamburger';

const settings = {
    cssProperties: {
        compressionDistance: '--header-compression',
        compressionProgress: '--header-compression-progress',
    },

    classNames: {
        fixedContainer: 'header__fixed-container',
        sticky: 'header--sticky',
        hidden: 'header--hidden',
        hamburger: 'header__hamburger',
    },

    forceVisibilityElementSelector: `*[data-header-visible="true"]`,
    suppressVisibilityElementSelector: `*[data-header-visible="false"]`,

    // Settings related to toggling header visibility based on scroll intent
    scrollVelocity: {
        // pixels per millisecond
        triggerSpeed: 1.2,
    },
};

/**
 * Header sticky modes
 * @readonly
 * @enum {number}
 */
export const headerStickyModes = {
    /**
     * The header never becomes sticky
     */
    never: 1,

    /**
     * The header becomes sticky after it reaches the top
     * of the viewport
     */
    always: 2,

    /**
     * The header becomes sticky after it reaches the top
     * of the viewport, then appears and disappears based
     * on how quickly the user is scrolling upward or
     * downward
     */
    scrollIntent: 3,
};

// Our single header instance, created via Header.init()
/** @type {Header} */
let header = null;

// Flag for suppressing visibility momentarily, used when scrolling
// scrolling upward programatically
/** @type {boolean} */
let suppressVisibilityOverride = false;

/**
 * Website header, incorporating mobile menu, sticky w/ scroll-intent
 * show/hide, etc.
 */
export class Header {
    /**
     * @constructor
     * @param {headerStickyModes} stickyMode
     */
    constructor(stickyMode = headerStickyModes.scrollIntent) {
        /** @type {headerStickyModes} */
        this.stickyMode = stickyMode;

        /** @type {boolean} */
        this.isSticky = false;

        /** @type {boolean} */
        this.isVisible = true;

        /** @type {number} */
        this.scrollVelocity = 0;

        /** @type {number} */
        this.lastScrollPosition = window.pageYOffset;

        // Note that this is configured to be far in the past
        // so as to avoid the header hiding immediately on page load
        // when the browser is scrolled down
        /** @type {number} */
        this.lastScrollTime = 0;

        // Locate our DOM elements
        /** @type {Element} */
        this.container = document.querySelector('header');
        if (!this.container) {
            return;
        }

        /** @type {Element} */
        this.fixedContainer = this.container.querySelector(`.${settings.classNames.fixedContainer}`);
        if (!this.fixedContainer) {
            return;
        }

        /** @type {number} */
        this.compressionProgress = 0;

        // Monitor for breakpoint changes to detect the amount
        // by which the header compresses when sticky
        const breakpointChangeCallback = () => {
            const styles = window.getComputedStyle(this.container);
            this.compressionDistance = styles.getPropertyValue(
                settings
                    .cssProperties
                    .compressionDistance,
            );

            if (this.compressionDistance) {
                this.compressionDistance =
                    parseInt(this.compressionDistance);
            } else {
                this.compressionDistance = 0;
            }
        };

        WindowMetrics.addBeakpointChangeCallback(breakpointChangeCallback);
        breakpointChangeCallback();

        // Check for any elements that force the header to be
        // visible or hidden while on screen
        /** @type {NodeList} */
        this.forceVisibilityElements = document
            .querySelectorAll(settings.forceVisibilityElementSelector);

        /** @type {NodeList} */
        this.suppressVisibilityElements = document
            .querySelectorAll(settings.suppressVisibilityElementSelector);

        // Setup navigation
        const navContainer = this.container.querySelector('nav');
        if (navContainer) {
            this.nav = new Nav(
                navContainer,
                this.container,
                {
                    onOpenStart: () => {
                        // Update hamburger state
                        this.hamburger.setSelectedState(true);
                    },

                    onCloseStart: () => {
                        // Update hamburger state
                        this.hamburger.setSelectedState(false);
                    },
                },
            );
        }

        // Setup hamburger
        const hamburgerContainer = this.container.querySelector(`.${settings.classNames.hamburger}`);
        if (hamburgerContainer) {
            this.hamburger = new Hamburger(
                hamburgerContainer,
                (event) => {
                    // Stop if we're not in mobile mode
                    if (!WindowMetrics.isMobile()) {
                        return;
                    }

                    // Stop if we're not visible (we may be transitioning
                    // between states)
                    if (!this.isVisible) {
                        return;
                    }

                    // Toggle nav menu visibility
                    if (this.nav.isOpen) {
                        // Close the nav menu
                        this.nav.closeMobileMenu(false, event.shiftKey);
                    } else {
                        const callback = function() {
                            this.nav.openMobileMenu(false, event.shiftKey);
                        }.bind(this);

                        // Check if the header is beneath the top of the viewport
                        // (e.g., if there are banners above it)
                        const bounds = this.container.getBoundingClientRect();
                        if (bounds.top > 0) {
                            // Scroll down so the header will be at the top
                            // of the viewport
                            const scrollTarget = window.pageYOffset +
                                bounds.top;
                            window.scrollTo({
                                left: 0,
                                top: scrollTarget,
                                behavior: 'smooth',
                            });

                            // Wait for scroll to complete
                            const startTime = (new Date()).getTime();
                            const interval = setInterval(
                                function() {
                                    // Stop monitoring after a second in case
                                    // something gets goofed up
                                    let elapsedTime = (new Date()).getTime();
                                    elapsedTime -= startTime;
                                    if (elapsedTime > 1000) {
                                        // Eh, stop monitoring and don't open
                                        // the menu
                                        clearInterval(interval);
                                        return;
                                    }

                                    // Check if we're close to the target scroll
                                    // position
                                    const distanceRemaining = Math
                                        .abs(window.pageYOffset - scrollTarget);

                                    if (distanceRemaining <= 0.5) {
                                        // We're close - stop monitoring and
                                        // open the menu
                                        clearInterval(interval);
                                        callback();
                                    }
                                },
                                10,
                            );
                        } else {
                            // Open the nav menu immediately
                            callback();
                        }
                    }
                },
            );
        }

        // Start monitoring the scroll position
        let lastScrollPosition;
        let lastViewportWidth;
        let lastViewportHeight;
        const tick = () => {
            let trigger = false;
            if (window.innerWidth !== lastViewportWidth) {
                trigger = true;
                lastViewportWidth = window.innerWidth;
            }

            if (window.innerHeight !== lastViewportHeight) {
                trigger = true;
                lastViewportHeight = window.innerHeight;
            }

            if (window.scrollY !== lastScrollPosition) {
                trigger = true;
                lastScrollPosition = window.scrollY;
            }

            if (trigger) {
                // Recalculate positioning
                this.updatePositioning();
            }

            window.requestAnimationFrame(tick);
        };

        tick();

        // // Testing
        // if (WindowMetrics.isMobile()) {
        //     this.nav.openMobileMenu();
        // }
    }

    /**
     * Initializes the header if the associated element
     * is found on the DOM
     * @param {headerStickyModes} stickyMode
     */
    static init(stickyMode = headerStickyModes.scrollIntent) {
        // Stop if we've already initialized
        if (header) {
            return;
        }

        header = new Header(stickyMode);
    }

    /**
     * Returns the current header instance (when used in the same compiled
     * CSS that called the "init" method)
     * @return {Header}
     */
    static get current() {
        return header;
    }

    /**
     * When using the sticky mode "scrollIntent", calling this
     * method will prevent the header from becoming hidden for
     * the sepecified duration
     * @param {number} duration The duration for which hiding will be disabled, in milliseconds
     */
    static suppressVisibility(duration = 1000) {
        suppressVisibilityOverride = true;

        setTimeout(
            () => {
                suppressVisibilityOverride = false;
            },
            duration,
        );
    }

    /**
     * Updates the state of the header, generally due to viewport scrolling,
     * resizing, or explicit updates to the page content that affect its
     * position (e.g., banners appearing & disappearing)
     */
    updatePositioning() {
        // Do nothing if the mobile menu is open
        if (this.nav) {
            if (this.nav.isOpen) {
                return;
            }
        }

        // First, check our compression state against the current
        // scroll position
        const bounds = this.container.getBoundingClientRect();
        let newCompressionProgress;
        if (this.compressionDistance > 0) {
            newCompressionProgress = trimValue(
                -bounds.top / this.compressionDistance,
            );

            if (newCompressionProgress < 0) {
                newCompressionProgress = 0;
            } else if (newCompressionProgress > 1) {
                newCompressionProgress = 1;
            }
        } else {
            newCompressionProgress = 0;
        }

        if (newCompressionProgress != this.compressionProgress) {
            // Our progress has changed - update the property
            this.compressionProgress = newCompressionProgress;
            this.container.style.setProperty(
                settings.cssProperties.compressionProgress,
                newCompressionProgress,
            );
        }

        // Next, determine if we should be sticky - stop here if our
        // sticky mode is set to "never"
        if (this.stickyMode == headerStickyModes.never) {
            return;
        }

        // If compression is enabled, we become sticky once we're fully
        // compressed; otherwise, it will occur once the header has
        // reached the top of the viewport
        if (this.compressionDistance > 0) {
            // Compression is enabled - check its progress
            if (this.compressionProgress >= 1) {
                // We're fully compressed and should be sticky
                setStickyState.call(this, true);
            } else {
                // We're not fully compressed and shouldn't be sticky
                setStickyState.call(this, false);
            }
        } else {
            // Compression isn't enabled - check the position of
            // the header in the viewport
            if (bounds.top >= 0) {
                // We shouldn't be sticky
                setStickyState.call(this, false);
            } else {
                // We should be sticky
                setStickyState.call(this, true);
            }
        }

        // Next, determine if we should be hidden or visible - stop here
        // if our sticky mode isn't set to "scrollIntent"
        if (this.stickyMode != headerStickyModes.scrollIntent) {
            return;
        }

        // If we're not sticky, make sure we're visible
        if (!this.isSticky) {
            setVisibleState.call(this, true);

            // Stop here
            return;
        }

        // If the "suppressVisibilityOverride" flag is set,
        // force the header to stay or become hidden
        if (suppressVisibilityOverride) {
            setVisibleState.call(this, false);

            // Stop here
            return;
        }

        // Determine if we should or shouldn't be allowed to
        // become hidden
        const scrollPosition = window.pageYOffset;
        let forceVisibility = false;
        let suppressVisibility = false;
        if (scrollPosition < this.fixedContainer.clientHeight + 1) {
            // The user hasn't yet scrolled past the height of the
            // header itself - remain visible
            forceVisibility = true;
        } else {
            // If any elements were found on the DOM based off of our
            // force visibility selector, check if any of them are in
            // the viewport with their top edge (roughly) at the top
            // of the viewport - this is basically just for the scroll
            // locked hero components
            for (let i=0; i<this.forceVisibilityElements.length; i++) {
                const visibilityElementBounds =
                    this.forceVisibilityElements[i]
                        .getBoundingClientRect();

                // The 1 pixel adjustments is to give a little wiggle
                // room in case the actual pixel locations are fractional
                if (
                    visibilityElementBounds.top > -1 &&
                    visibilityElementBounds.top < 1
                ) {
                    // Element is at the top of the viewport - force
                    // the header to be visible
                    forceVisibility = true;
                }
            }

            // If any elements were found on the DOM based off of our
            // suppress visibility selector, check if any of them span
            // the top of the viewport - this is basically just for the
            // tab containers that have a sticky button bar
            for (let i=0; i<this.suppressVisibilityElements.length; i++) {
                const visibilityElementBounds =
                    this.suppressVisibilityElements[i]
                        .getBoundingClientRect();

                if (
                    visibilityElementBounds.top < 0 &&
                    visibilityElementBounds.bottom > 0
                ) {
                    // Element spans the top of the viewport - force
                    // the header to be hidden
                    suppressVisibility = true;
                }
            }
        }

        // If for some reason we've detected that we should both force
        // and suppress visibility simultaneously, let "force" take
        // precedence
        if (forceVisibility) {
            // We're forcing the header to be visible
            setVisibleState.call(this, true);

            // Stop here
            return;
        }

        if (suppressVisibility) {
            // We're forcing the header to be hidden
            setVisibleState.call(this, false);

            // Stop here
            return;
        }

        // Determine if the scroll velocity should cause
        // a change in our visibility
        const scrollTime = (new Date()).getTime();
        const timeDifference = scrollTime - this.lastScrollTime;

        // Filter out large gaps in time and smooth out big changes in velocity
        if (timeDifference > 500) {
            this.scrollVelocity = 0;
        } else {
            this.scrollVelocity =
                (this.lastScrollPosition - scrollPosition) /
                timeDifference;
        }

        // Update the previously sampled values to what we just measured
        this.lastScrollPosition = scrollPosition;
        this.lastScrollTime = scrollTime;

        // Check if we've surpassed our scroll speed threshold,
        // scrolling either upward or downward
        if (this.scrollVelocity >= settings.scrollVelocity.triggerSpeed) {
            // We've surpassed the threshold scrolling upward -
            // make the header visible if it isn't
            setVisibleState.call(this, true);
        } else if (
            this.scrollVelocity <= -settings.scrollVelocity.triggerSpeed
        ) {
            // We've surpassed the threshold scrolling downward -
            // make the header unsticky if it isn't
            setVisibleState.call(this, false);
        }
    }
}

/*
    Internal methods
*/

/**
 * Toggles between sticky & unsticky states - note that
 * this is only called in the appropriate context and
 * doesn't repeat the checks that would be needed, like
 * making sure the mobile menu isn't open or that an
 * appropriate sticky mode has been specified
 * @this Header
 * @param {boolean} sticky
 */
function setStickyState(sticky) {
    if (sticky) {
        // Becoming sticky
        if (this.isSticky) {
            return;
        }

        this.isSticky = true;
        this.scrollVelocity = 0;
        this.container
            .classList
            .add(settings.classNames.sticky);
    } else {
        // Becoming unsticky
        if (!this.isSticky) {
            return;
        }

        this.isSticky = false;
        this.scrollVelocity = 0;
        this.container
            .classList
            .remove(settings.classNames.sticky);
    }
}

/**
 * Toggles between visible & hidden states - note that
 * this is only called in the appropriate context and
 * doesn't repeat the checks that would be needed, like
 * making sure the mobile menu isn't open or that an
 * appropriate sticky mode has been specified
 * @this Header
 * @param {boolean} visible
 */
function setVisibleState(visible) {
    if (visible) {
        // Becoming visible
        if (this.isVisible) {
            return;
        }

        // Become visible
        this.isVisible = true;
        this.scrollVelocity = 0;
        this.container
            .classList
            .remove(settings.classNames.hidden);
    } else {
        // Becoming hidden
        if (!this.isVisible) {
            return;
        }

        // Close any open nav submenus
        this.nav.closeOpenNavItems();

        this.isVisible = false;
        this.scrollVelocity = 0;
        this.container
            .classList
            .add(settings.classNames.hidden);
    }
}
