import {disableBodyScroll, enableBodyScroll} from 'body-scroll-lock';
import WindowMetrics from '../../utilities/window-metrics';

// Components
import Backdrop from '../backdrop';
import NavItem from './nav-item';

const settings = {
    classNames: {
        scrollContainer: 'header__nav-scroll-container',
        navItem: 'header__nav-item',

        // Note these is applied to the parent <header> element
        open: 'header--open',
        closing: 'header--closing',
    },

    animation: {
        slowMoScale: 4,
        openDuration: 0.5,
        closeDuration: 0.5,
    },
};

/**
 * Header navigation menu
 */
export default class Nav {
    /**
     * @constructor
     * @param {Element} container
     * @param {Element} headerContainer
     * @param {object} callbacks
     * @param {function} callbacks.onOpenStart
     * @param {function} callbacks.onCloseStart
     */
    constructor(
        container,
        headerContainer,
        callbacks = {},
    ) {
        /** @type {Element} */
        this.container = container;

        /** @type {Element} */
        this.headerContainer = headerContainer;

        /** @type {object} */
        this.callbacks = callbacks;

        /** @type {boolean} */
        this.isOpen = false;

        /** @type {NavItem} */
        this.openNavItem = null;

        // Locate our DOM elements
        this.scrollContainer = this.container.querySelector(`.${settings.classNames.scrollContainer}`);
        if (!this.scrollContainer) {
            return;
        }

        this.innerContainer = this.container.querySelector(`.${settings.classNames.scrollContainer} > div`);
        if (!this.innerContainer) {
            return;
        }

        // Create backdrop
        this.backdrop = new Backdrop(
            this.headerContainer,
            (event) => {
                // Stop if we're not in mobile mode
                if (!WindowMetrics.isMobile()) {
                    return;
                }

                // Stop if we're closed or closing
                if (!this.isOpen) {
                    return;
                }

                // Close the menu
                this.closeMobileMenu(false, event.shiftKey);
            },
        );

        // Setup menu items
        const navItemContainers = this.innerContainer.getElementsByClassName(
            settings
                .classNames
                .navItem,
        );

        const submenuCallbacks = {
            onOpen: function(navItem) {
                if (this.openNavItem) {
                    if (this.openNavItem != navItem) {
                        this.openNavItem.closeSubmenu();
                    }
                }

                this.openNavItem = navItem;
            }.bind(this),

            onClose: function(navItem) {
                if (this.openNavItem == navItem) {
                    this.openNavItem = null;
                }
            }.bind(this),
        };

        for (let i=0; i<navItemContainers.length; i++) {
            new NavItem(
                navItemContainers[i],
                submenuCallbacks,
            );
        }

        // Setup <body> touch event to close any open menus
        document.body.addEventListener(
            'touchstart',
            (event) => {
                // Check that a submenu is open
                if (!this.openNavItem) {
                    return;
                }

                // Check that this click didn't occur within the open
                // submenu
                if (
                    this.openNavItem.container == event.target ||
                    this.openNavItem.container.contains(event.target)
                ) {
                    return;
                }

                // Close the open submenu
                this.closeOpenNavItems();
            },
        );

        // Setup a mobile-to-desktop breakpoint change event
        WindowMetrics.addBeakpointChangeCallback(
            function(mobileDesktopTransition) {
                if (!mobileDesktopTransition) {
                    return;
                }

                // Close any open submenus
                this.closeOpenNavItems();

                if (WindowMetrics.isMobile()) {
                    return;
                }

                // We're in desktop
                if (this.isOpen) {
                    // The menu is open - close it immediately
                    this.closeMobileMenu(true);
                }
            }.bind(this),
        );
    }

    /**
     * Closes any open nav item submenus
     */
    closeOpenNavItems() {
        if (this.openNavItem) {
            this.openNavItem.closeSubmenu();
        }
    }

    /**
     * Opens the mobile nav menu
     * @param {boolean} immediate
     * @param {boolean} slowMo
     */
    openMobileMenu(
        immediate = false,
        slowMo = false,
    ) {
        if (this.isOpen) {
            return;
        }

        // Perform callback
        if (this.callbacks.onOpenStart) {
            this.callbacks.onOpenStart();
        }

        this.isOpen = true;

        // Stop any ongoing animation
        if (this.menuTimeline) {
            this.menuTimeline.progress(1);
        }

        // Lock scrolling
        disableBodyScroll(
            this.scrollContainer,
            {
                reserveScrollBarGap: true,
            },
        );

        // Add "open" class
        this.headerContainer.classList.add(settings.classNames.open);

        // Show the nav menu and remove any styles
        this.container.removeAttribute('style');
        this.scrollContainer.removeAttribute('style');
        this.container.style.display = 'block';

        // Show our backdrop
        this.backdrop.show(immediate, slowMo);

        if (immediate) {
            // Reset scroll position
            this.container.scrollTo(0, 0);
            return;
        }

        // Animate transition
        let duration = settings.animation.openDuration;
        if (slowMo) {
            duration *= settings.animation.slowMoScale;
        }

        this.menuTimeline = gsap.timeline();
        this.menuTimeline.from(
            this.scrollContainer,
            duration,
            {
                ease: 'power2.out',
                height: 0,
            },
            0,
        );

        this.menuTimeline.add(function() {
            // Remove explicit height from the nav menu
            this.scrollContainer.removeAttribute('style');

            // Reset scroll position
            this.container.scrollTo(0, 0);

            // Clear our timeline variable
            this.menuTimeline = null;
        }.bind(this));
    }

    /**
     * Closes the mobile nav menu
     * @param {boolean} immediate
     * @param {boolean} slowMo
     */
    closeMobileMenu(
        immediate = false,
        slowMo = false,
    ) {
        if (!this.isOpen) {
            return;
        }

        // Perform callback
        if (this.callbacks.onCloseStart) {
            this.callbacks.onCloseStart();
        }

        this.isOpen = false;

        // Stop any ongoing animation
        if (this.menuTimeline) {
            this.menuTimeline.progress(1);
        }

        // Unlock scrolling
        enableBodyScroll(this.scrollContainer);

        // Add "closing" class
        this.headerContainer.classList.add(settings.classNames.closing);

        // Remove "open" class
        this.headerContainer.classList.remove(settings.classNames.open);

        // Hide our backdrop
        this.backdrop.hide(immediate, slowMo);

        if (immediate) {
            // Remove "closing" class
            this.headerContainer.classList.remove(settings.classNames.closing);

            // Reset nav styles
            this.container.removeAttribute('style');
            this.scrollContainer.removeAttribute('style');
            return;
        }

        // Animate transition
        let duration = settings.animation.closeDuration;
        if (slowMo) {
            duration *= settings.animation.slowMoScale;
        }

        this.menuTimeline = gsap.timeline();

        this.container.style.height = '';
        this.menuTimeline.to(
            this.scrollContainer,
            duration,
            {
                ease: 'power2.out',
                height: 0,
            },
            0,
        );

        this.menuTimeline.add(function() {
            // Remove "closing" class
            this.headerContainer.classList.remove(settings.classNames.closing);

            // Reset nav styles
            this.container.removeAttribute('style');
            this.scrollContainer.removeAttribute('style');

            // Clear our timeline variable
            this.menuTimeline = null;
        }.bind(this));
    }
}
