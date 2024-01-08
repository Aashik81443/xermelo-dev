import {disableBodyScroll, enableBodyScroll} from 'body-scroll-lock';

// Components
import Backdrop from './backdrop';

/**
 * ISI tray settings
 */
const settings = {
    containerId: 'isi-tray',
    classNames: {
        innerContainer: 'grid',
        collapsedContent: 'isi__collapsed-content',
        expandedContent: 'isi__expanded-content',
        visible: 'isi-tray--visible',
        open: 'isi-tray--open',
        closing: 'isi-tray--closing',
        scroll: 'isi-tray--scroll',
    },

    animation: {
        slowMoScale: 4,
        openDuration: 0.5,
        closeDuration: 0.5,
    },
};

/**
 * Our single ISI tray instance, created via IsiTray.init()
 * @type {IsiTray}
 */
let isiTray = null;

/**
 * A floating ISI tray
 */
export default class IsiTray {
    /**
     * @constructor
     */
    constructor() {
        /** @type {boolean} */
        this.isVisible = false;

        /** @type {boolean} */
        this.isOpen = false;

        /** @type {boolean} */
        this.scrollEnabled = false;

        // Locate our DOM elements
        /** @type {Element} */
        this.container = document.getElementById(settings.containerId);
        if (!this.container) {
            return;
        }

        /** @type {Element} */
        this.innerContainer = this.container.querySelector(`.${settings.classNames.innerContainer}`);

        /** @type {Element} */
        this.onPageIsi = document.getElementById('isi');

        /** @type {Element} */
        this.collapsedContent = this.container.querySelector(`.${settings.classNames.collapsedContent}`);

        /** @type {Element} */
        this.expandedContent = this.container.querySelector(`.${settings.classNames.expandedContent}`);

        // Create backdrop
        /** @type {Backdrop} */
        this.backdrop = new Backdrop(
            this.container,
            (event) => {
                // Stop if we're not open
                if (!this.isOpen) {
                    return;
                }

                // Close the menu
                this.close(false, event.shiftKey);
            },
        );

        // Setup expand/collapse button
        /** @type {Element} */
        this.button = this.container.querySelector('#isi-tray__button');
        if (!this.button) {
            return;
        }

        this.button.addEventListener(
            'click',
            (event) => {
                event.preventDefault();
                event.stopPropagation();

                // Stop if we're not visible
                if (!this.isVisible) {
                    return;
                }

                // Toggle open/close state
                if (this.isOpen) {
                    this.close(false, event.shiftKey);
                } else {
                    this.open(false, event.shiftKey);
                }
            });

        // Setup window resize event
        window.addEventListener(
            'resize',
            () => {
                // Stop if we're not visible & open
                if (!this.isVisible || !this.isOpen) {
                    return;
                }

                // Determine if the container needs a scroll bar
                if (
                    this.container.clientHeight <
                    this.innerContainer.clientHeight
                ) {
                    // Enable scrolling
                    if (!this.scrollEnabled) {
                        this.scrollEnabled = true;
                        this.container
                            .classList
                            .add(settings.classNames.scroll);
                    }
                } else {
                    // Disable scrolling
                    if (this.scrollEnabled) {
                        this.scrollEnabled = false;
                        this.container
                            .classList
                            .remove(settings.classNames.scroll);
                    }
                }
            },
        );

        // Check if an on-page ISI is present
        if (this.onPageIsi) {
            // An on-page ISI is present - setup scroll-based show/hide
            const checkVisibilityCallback = () => {
                // Stop if we're open
                if (this.isOpen) {
                    return;
                }

                // Determine where we are on the page with respect to the on-page ISI
                const bounds = this.onPageIsi.getBoundingClientRect();
                const visibleOnPageIsiPixels = window.innerHeight - bounds.top;
                if (visibleOnPageIsiPixels >= this.container.clientHeight) {
                    // The on-page ISI has scrolled onscreen and we shouldn't be visible
                    if (this.isVisible) {
                        this.isVisible = false;
                        this.container
                            .classList
                            .remove(settings.classNames.visible);
                    }
                } else {
                    // The on-page ISI hasn't scrolled onscreen and we should be visible
                    if (!this.isVisible) {
                        this.isVisible = true;
                        this.container
                            .classList
                            .add(settings.classNames.visible);
                    }
                }
            };

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
                    checkVisibilityCallback();
                }

                window.requestAnimationFrame(tick);
            };

            tick();
        } else {
            // No on-page ISI found - stay permanently visible
            this.isVisible = true;
            this.container
                .classList
                .add(settings.classNames.visible);
        }
    }

    /**
     * Initializes the ISI tray if the associated element
     * is found on the DOM
     */
    static init() {
        // Stop if we've already initialized
        if (isiTray) {
            return;
        }

        isiTray = new IsiTray();
    }

    /**
     * Opens the ISI tray, if visible and closed
     * @param {boolean} immediate
     * @param {boolean} slowMo
     */
    open(
        immediate = false,
        slowMo = false,
    ) {
        if (this.isOpen) {
            return;
        }

        this.isOpen = true;

        // Stop any ongoing animation
        if (this.openCloseTimeline) {
            this.openCloseTimeline.progress(1);
        }

        // Lock scrolling
        disableBodyScroll(
            this.container,
            {
                reserveScrollBarGap: true,
            },
        );

        // Show our backdrop
        this.backdrop.show(immediate, slowMo);

        if (immediate) {
            // Add "open" class
            this.container
                .classList
                .add(settings.classNames.open);

            // Stop here
            return;
        }

        // Animate transition
        const initialHeight = this.container.clientHeight;

        let duration = settings.animation.openDuration;
        if (slowMo) {
            duration *= settings.animation.slowMoScale;
        }

        // Add "open" class
        this.container
            .classList
            .add(settings.classNames.open);

        // Determine if the container needs a scroll bar when opened
        if (this.container.clientHeight < this.innerContainer.clientHeight) {
            // Enable scrolling
            if (!this.scrollEnabled) {
                this.scrollEnabled = true;
                this.container
                    .classList
                    .add(settings.classNames.scroll);
            }
        } else {
            // Disable scrolling
            if (this.scrollEnabled) {
                this.scrollEnabled = false;
                this.container
                    .classList
                    .remove(settings.classNames.scroll);
            }
        }

        this.openCloseTimeline = gsap.timeline();

        // Tray opens with a height transition
        this.openCloseTimeline.from(
            this.container,
            duration,
            {
                ease: 'power2.out',
                height: initialHeight,
            },
            0,
        );

        // If collapsed and expanded content are present,
        // crossfade between them
        if (this.collapsedContent && this.expandedContent) {
            this.collapsedContent.style.position = 'absolute';
            this.collapsedContent.style.display = 'block';
            this.openCloseTimeline.to(
                this.collapsedContent,
                duration,
                {
                    ease: 'power3.out',
                    opacity: 0,
                },
                0,
            );

            this.expandedContent.style.position = 'absolute';
            this.openCloseTimeline.from(
                this.expandedContent,
                duration,
                {
                    ease: 'power3.out',
                    opacity: 0,
                },
                0,
            );
        }

        this.openCloseTimeline.add(() => {
            this.openCloseTimeline = null;
            this.container.removeAttribute('style');

            if (this.collapsedContent && this.expandedContent) {
                this.collapsedContent.removeAttribute('style');
                this.expandedContent.removeAttribute('style');
            }
        });
    }

    /**
     * Closes the ISI tray, if visible and open
     * @param {boolean} immediate
     * @param {boolean} slowMo
     */
    close(
        immediate = false,
        slowMo = false,
    ) {
        if (!this.isOpen) {
            return;
        }

        this.isOpen = false;

        // Stop any ongoing animation
        if (this.openCloseTimeline) {
            this.openCloseTimeline.progress(1);
        }

        // Unlock scrolling
        enableBodyScroll(this.container);

        // Hide our backdrop
        this.backdrop.hide(immediate, slowMo);

        if (immediate) {
            // Remove "open" class
            this.container
                .classList
                .remove(settings.classNames.open);

            // Stop here
            return;
        }

        // Animate transition
        const initialHeight = this.container.clientHeight;

        let duration = settings.animation.closeDuration;
        if (slowMo) {
            duration *= settings.animation.slowMoScale;
        }

        // Disable scrolling
        if (this.scrollEnabled) {
            this.scrollEnabled = false;
            this.container
                .classList
                .remove(settings.classNames.scroll);
        }

        // Add "closing" class
        this.container
            .classList
            .add(settings.classNames.closing);

        // Remove "open" class
        this.container
            .classList
            .remove(settings.classNames.open);

        this.openCloseTimeline = gsap.timeline();

        // Tray closes with a height transition
        this.openCloseTimeline.from(
            this.container,
            duration,
            {
                ease: 'power2.out',
                height: initialHeight,
            },
            0,
        );

        // If collapsed and expanded content are present,
        // crossfade between them
        if (this.collapsedContent && this.expandedContent) {
            this.collapsedContent.style.position = 'absolute';
            this.openCloseTimeline.from(
                this.collapsedContent,
                duration,
                {
                    ease: 'power3.out',
                    opacity: 0,
                },
                0,
            );

            this.expandedContent.style.position = 'absolute';
            this.expandedContent.style.display = 'block';
            this.openCloseTimeline.to(
                this.expandedContent,
                duration,
                {
                    ease: 'power3.out',
                    opacity: 0,
                },
                0,
            );
        }

        this.openCloseTimeline.add(() => {
            this.openCloseTimeline = null;
            this.container.removeAttribute('style');

            // Remove "closing" class
            this.container
                .classList
                .remove(settings.classNames.closing);

            if (this.collapsedContent && this.expandedContent) {
                this.collapsedContent.removeAttribute('style');
                this.expandedContent.removeAttribute('style');
            }
        });
    }
}
