import WindowMetrics from '../../utilities/window-metrics';
import {parseJsonAttribute} from '../../utilities/utilities';

const settings = {
    classNames: {
        active: 'header--active',
        hover: 'header__nav-item--hover',
        open: 'header__nav-item--open',
    },

    animation: {
        openDuration: 0.25,
        closeDuration: 0.25,
    },
};

/**
 * Individual items within a header's navigation menu -
 * these may be simple links or submenus
 */
export default class NavItem {
    /**
     * @constructor
     * @param {Element} container
     * @param {object} callbacks
     * @param {function} callbacks.onOpen
     * @param {function} callbacks.onClose
     */
    constructor(
        container,
        callbacks = {},
    ) {
        this.container = container;
        this.callbacks = callbacks;
        this.button = this.container.firstElementChild;
        this.submenu = container.querySelector('ul');
        this.isHover = false;
        this.isOpen = false;

        // Set any active states within this navigation item
        setLinkActiveStates.call(this);

        // Setup hover events

        // Check if this item contains a submenu
        if (!this.submenu) {
            // No submenu found - just set up hover events
            this.container.addEventListener(
                'mouseenter',
                (event) => {
                    this.setHoverState(true);
                },
            );

            this.container.addEventListener(
                'mouseleave',
                (event) => {
                    this.setHoverState(false);
                },
            );

            // Stop here
            return;
        }

        // Setup the submenu open/close events
        this.container.addEventListener(
            'mouseenter',
            (event) => {
                this.openSubmenu();
            },
        );

        this.container.addEventListener(
            'mouseleave',
            (event) => {
                this.closeSubmenu();
            },
        );

        this.container.addEventListener(
            'touchstart',
            (event) => {
                // Filter out events occurring on elements
                // within our menu
                if (
                    event.target != this.button &&
                    event.target != this.submenu
                ) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                if (this.isOpen) {
                    this.closeSubmenu();
                } else {
                    this.openSubmenu();
                }
            },
        );
    }

    /**
     * Sets or removes this item's hover state
     * @param {boolean} hoverState
     */
    setHoverState(hoverState) {
        if (hoverState == this.isHover) {
            return;
        }

        this.isHover = hoverState;
        if (this.isHover) {
            // Add "hover" class
            this.container
                .classList
                .add(settings.classNames.hover);
        } else {
            // Remove "hover" class
            this.container
                .classList
                .remove(settings.classNames.hover);
        }
    }

    /**
     * Opens this item's submenu
     */
    openSubmenu() {
        if (this.isOpen) {
            return;
        }

        this.isOpen = true;

        // Stop any ongoing animation
        if (this.submenuTimeline) {
            this.submenuTimeline.progress(1);
        }

        // Set hover state
        this.setHoverState(true);

        // Add "open" class
        this.container
            .classList
            .add(settings.classNames.open);

        if (WindowMetrics.isMobile()) {
            // Finish transition immediately
            this.submenu.removeAttribute('style');
        } else {
            // Animate transition
            this.container.style.zIndex = 2;

            this.submenuTimeline = gsap.timeline();
            this.submenuTimeline.from(
                this.submenu,
                settings.animation.openDuration,
                {
                    ease: 'power2.out',
                    height: this.submenu.firstElementChild.offsetTop,
                },
            );

            this.submenuTimeline.add(
                function() {
                    this.submenuTimeline = null;
                    this.submenu.removeAttribute('style');
                }.bind(this),
            );
        }

        // Perform callback
        this.callbacks.onOpen(this);
    }

    /**
     * Closes this item's submenu
     */
    closeSubmenu() {
        if (!this.isOpen) {
            return;
        }

        this.isOpen = false;

        // Stop any ongoing animation
        if (this.submenuTimeline) {
            this.submenuTimeline.progress(1);
        }

        // Set hover state
        this.setHoverState(false);

        if (WindowMetrics.isMobile()) {
            // Finish transition immediately
            this.submenu.removeAttribute('style');

            // Remove "open" class
            this.container
                .classList
                .remove(settings.classNames.open);
        } else {
            // Animate transition
            this.container.style.zIndex = '';

            this.submenuTimeline = gsap.timeline();
            this.submenuTimeline.to(
                this.submenu,
                settings.animation.closeDuration,
                {
                    ease: 'power2.out',
                    height: this.submenu.firstElementChild.offsetTop,
                },
            );

            this.submenuTimeline.add(
                function() {
                    this.submenuTimeline = null;

                    this.submenu.removeAttribute('style');

                    // Remove "open" class
                    this.container
                        .classList
                        .remove(settings.classNames.open);
                }.bind(this),
            );
        }

        // Perform callback
        this.callbacks.onClose(this);
    }
}

/*
    Internal methods
*/

/**
 * Set nav items' active state based on current URL to indicate
 * which is associated with the current route
 * @this NavItem
 */
function setLinkActiveStates() {
    const anchorElements = this.container.querySelectorAll('a');
    let activeLink = null;
    for (let j=0; j<anchorElements.length; j++) {
        const anchorElement = anchorElements[j];

        // Check if this link's href attribute matches the current location
        // Note: "element.href" returns a full URL
        if (anchorElement.getAttribute('href') == window.location.pathname) {
            activeLink = anchorElement;
            break;
        }

        // Check if a data attribute was provided with alternates
        const parameters = parseJsonAttribute(
            anchorElement,
            'data-header',
        );

        if (parameters.alternateHrefs) {
            for (let k=0; k<parameters.alternateHrefs.length; k++) {
                const alternateHref = parameters.alternateHrefs[k];
                if (alternateHref == window.location.pathname) {
                    activeLink = anchorElement;
                    break;
                }
            }

            if (activeLink) {
                break;
            }
        }
    }

    if (activeLink) {
        this.container.classList.add(settings.classNames.active);

        const subNavItem = activeLink.closest('li');
        if (subNavItem) {
            subNavItem.classList.add(settings.classNames.active);
        }
    }
}
