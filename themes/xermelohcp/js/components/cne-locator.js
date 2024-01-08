const settings = {
    classNames: {
        container: 'cne-locator',
        interfaceContainer: 'cne-locator__interface',
        openCloseButton: 'cne-locator__intro__open-close-button',
        open: 'cne-locator--open',
        closing: 'cne-locator--closing',
        selected: 'cne-locator--selected',
        hidden: 'cne-locator--hidden',
    },
};

/**
 * Drives the "Meet our Nurses" widget on the "Ask a Nurse
 * About XERMELO" page
 */
export default class CneLocator {
    /**
     * @constructor
     * @param {Element} container The element for which to initialize
     */
    constructor(container) {
        /** @type {boolean} */
        this.isOpen = false;

        /** @type {number} */
        this.selectedRegionIndex = null;

        // Locate our DOM elements
        /** @type {Element} */
        this.container = container;

        /** @type {Element} */
        this.interfaceContainer = this.container.querySelector(`.${settings.classNames.interfaceContainer}`);
        if (!this.interfaceContainer) {
            return;
        }

        /** @type {Element} */
        this.openCloseButton = this.container.querySelector(`.${settings.classNames.openCloseButton}`);
        if (!this.openCloseButton) {
            return;
        }

        /** @type {Element} */
        this.unselectedMapImage = this.container.querySelector('.cne-locator__map img:not(*[data-region])');
        if (!this.unselectedMapImage) {
            return;
        }

        /** @type {Region[]} */
        this.regions = [];

        // Find all legend buttons and convert to an array
        let legendButtons = this.container.querySelectorAll('.cne-locator__legend > li[data-region]');
        legendButtons = Array.from(legendButtons);

        // Find all unique region IDs across the buttons
        let uniqueRegionIds = legendButtons.map((legendButton) => legendButton.getAttribute('data-region'));
        uniqueRegionIds = uniqueRegionIds.filter((value, index, self) => {
            return self.indexOf(value) === index;
        });

        // Loop through the unique region IDs
        uniqueRegionIds.forEach((regionId) => {
            const legendButtonsForRegion = legendButtons
                .filter((legendButton) => {
                    return legendButton.getAttribute('data-region') == regionId;
                });

            const mapButtons = this.container.querySelectorAll(`.cne-locator__map svg *[data-region="${regionId}"]`);
            if (!mapButtons) {
                return;
            }

            const mapImage = this.container.querySelector(`.cne-locator__map img[data-region="${regionId}"]`);
            if (!mapImage) {
                return;
            }

            const resultContent = this.container.querySelector(`.cne-locator__results > div[data-region="${regionId}"]`);
            if (!resultContent) {
                return;
            }

            const regionIndex = this.regions.length;
            const region = new Region(
                legendButtonsForRegion,
                mapButtons,
                mapImage,
                resultContent,
                () => {
                    selectRegion.call(this, regionIndex);
                },
            );

            this.regions.push(region);
        });

        // Setup open/close button
        this.openCloseButton.addEventListener(
            'click',
            (event) => {
                event.preventDefault();
                event.stopPropagation();

                // Toggle open state
                if (this.isOpen) {
                    this.closeInterface();
                } else {
                    this.openInterface();
                }
            },
        );

        // Setup body click event
        document.body.addEventListener(
            'click',
            (event) => {
                // Stop if the click occurred within our container
                if (event.target.closest('*[data-region]')) {
                    return;
                }

                selectRegion.call(this, null);
            },
        );

        // // Testing
        // this.openInterface(true);
    }

    /**
     * Initializes the CNE locator if the associated element
     * is found on the DOM
     */
    static init() {
        // Look for elements on the DOM matching our expected
        // class name
        const containers = document.getElementsByClassName(
            settings
                .classNames
                .container,
        );

        for (let i=0; i<containers.length; i++) {
            new CneLocator(containers[i]);
        }
    }

    /**
     * Opens the map interface
     * @param {boolean} immediate
     */
    openInterface(immediate = false) {
        // Stop if we're already open
        if (this.isOpen) {
            return;
        }

        this.isOpen = true;

        // Stop any ongoing animation
        if (this.timeline) {
            this.timeline.progress(1);
        }

        // Add "open" class
        this.container
            .classList
            .add(settings.classNames.open);

        // Scroll into view, if necessary
        let scrollDistance = 0;
        const bounds = this.interfaceContainer.getBoundingClientRect();

        // First check the ISI tray
        const isiTrayTop = getIsiTrayTop();
        if (isiTrayTop !== null) {
            if (bounds.bottom > isiTrayTop) {
                scrollDistance = bounds.bottom - isiTrayTop;
            }
        }

        // Next check the header
        const headerBottom = getHeaderBottom();
        if (headerBottom !== null) {
            const newBoundsTop = bounds.top - scrollDistance;
            if (newBoundsTop < headerBottom) {
                // Reduce the amount we're scrolling
                scrollDistance -= headerBottom - newBoundsTop;
            }
        }

        // Scroll if we've decided to do so
        if (scrollDistance != 0) {
            const scrollTarget = Math.floor(
                window.scrollY +
                scrollDistance,
            );

            window.scrollTo({
                left: 0,
                top: scrollTarget,
                behavior: 'smooth',
            });
        }

        const finishCallback = () => {
            // Clear timeline variable
            this.timeline = null;

            // Clear inline styles
            this.interfaceContainer.removeAttribute('style');
        };

        if (immediate) {
            finishCallback();

            // Stop here
            return;
        }

        // Animate transition
        this.timeline = gsap.timeline();

        this.timeline.from(
            this.interfaceContainer,
            0.5,
            {
                ease: 'power2.out',
                height: 0,
            },
            0,
        );

        this.timeline.add(finishCallback);
    }

    /**
     * Closes the map interface
     * @param {boolean} immediate
     */
    closeInterface(immediate = false) {
        // Stop if we're already closed
        if (!this.isOpen) {
            return;
        }

        this.isOpen = false;

        // Stop any ongoing animation
        if (this.timeline) {
            this.timeline.progress(1);
        }

        // Add "closing" class
        this.container
            .classList
            .add(settings.classNames.closing);

        // Remove "open" class
        this.container
            .classList
            .remove(settings.classNames.open);

        const finishCallback = () => {
            // Clear timeline variable
            this.timeline = null;

            // Remove "closing" class
            this.container
                .classList
                .remove(settings.classNames.closing);

            // Clear inline styles
            this.interfaceContainer.removeAttribute('style');

            // Deselect any selected region
            if (this.selectedRegionIndex !== null) {
                selectRegion.call(this, null);
            }
        };

        if (immediate) {
            finishCallback();

            // Stop here
            return;
        }

        // Animate transition
        this.timeline = gsap.timeline();

        this.timeline.to(
            this.interfaceContainer,
            0.5,
            {
                ease: 'power2.out',
                height: 0,
            },
            0,
        );

        this.timeline.add(finishCallback);
    }
}

/*
    Internal methods & classes
*/

/** Represents a clickable map region and its associated legend button(s) */
class Region {
    /**
     * @constructor
     * @param {Element[]} legendButtons
     * @param {NodeList} mapButtons
     * @param {Element} mapImage
     * @param {Element} resultContent
     * @param {function} selectCallback
     */
    constructor(
        legendButtons,
        mapButtons,
        mapImage,
        resultContent,
        selectCallback,
    ) {
        this.legendButtons = legendButtons;
        this.mapButtons = mapButtons;
        this.mapImage = mapImage;
        this.resultContent = resultContent;
        this.isSelected = false;

        for (let i=0; i<this.legendButtons.length; i++) {
            this.legendButtons[i].addEventListener('click', selectCallback);
        }

        for (let i=0; i<this.mapButtons.length; i++) {
            this.mapButtons[i].addEventListener('click', selectCallback);
        }
    }

    /**
     * Sets or unsets selected state
     * @param {boolean} selected
     */
    setSelectedState(selected) {
        if (selected == this.isSelected) {
            // Do nothing
            return;
        }

        // Update state
        this.isSelected = selected;

        if (this.isSelected) {
            // Select region
            for (let i=0; i<this.legendButtons.length; i++) {
                this.legendButtons[i]
                    .classList
                    .add(settings.classNames.selected);
            }

            for (let i=0; i<this.mapButtons.length; i++) {
                this.mapButtons[i]
                    .classList
                    .add(settings.classNames.selected);
            }

            this.mapImage
                .classList
                .add(settings.classNames.selected);

            this.resultContent
                .classList
                .add(settings.classNames.selected);
        } else {
            // Deselect region
            for (let i=0; i<this.legendButtons.length; i++) {
                this.legendButtons[i]
                    .classList
                    .remove(settings.classNames.selected);
            }

            for (let i=0; i<this.mapButtons.length; i++) {
                this.mapButtons[i]
                    .classList
                    .remove(settings.classNames.selected);
            }

            this.mapImage
                .classList
                .remove(settings.classNames.selected);

            this.resultContent
                .classList
                .remove(settings.classNames.selected);
        }
    }
}

/**
 * Switches the currently selected region
 * @this {CneLocator}
 * @param {number} index
 * @param {boolean} immediate
 */
function selectRegion(
    index,
    immediate = false,
) {
    if (
        index === this.selectedRegionIndex ||
        index < 0 ||
        index >= this.regions.length
    ) {
        return;
    }

    let fromRegion;
    if (this.selectedRegionIndex !== null) {
        fromRegion = this.regions[this.selectedRegionIndex];
    }

    let toRegion;
    if (index !== null) {
        toRegion = this.regions[index];
    }

    // If a region is currently selected, deselect it
    if (fromRegion) {
        fromRegion.setSelectedState(false);
    }

    // If we're navigating to a region, select it
    if (toRegion) {
        toRegion.setSelectedState(true);

        // Hide base/unselected map image if visible
        if (!fromRegion) {
            this.unselectedMapImage
                .classList
                .add(settings.classNames.hidden);
        }

        // Scroll into view, if necessary
        let scrollDistance = 0;
        const bounds = toRegion.resultContent.getBoundingClientRect();

        // First check the ISI tray
        const isiTrayTop = getIsiTrayTop();
        if (isiTrayTop !== null) {
            if (bounds.bottom > isiTrayTop) {
                scrollDistance = bounds.bottom - isiTrayTop;
            }
        }

        // Next check the header
        const headerBottom = getHeaderBottom();
        if (headerBottom !== null) {
            const newBoundsTop = bounds.top - scrollDistance;
            if (newBoundsTop < headerBottom) {
                // Reduce the amount we're scrolling
                scrollDistance -= headerBottom - newBoundsTop;
            }
        }

        // Scroll if we've decided to do so
        if (scrollDistance != 0) {
            const scrollTarget = Math.floor(
                window.scrollY +
                scrollDistance,
            );

            window.scrollTo({
                left: 0,
                top: scrollTarget,
                behavior: 'smooth',
            });
        }
    } else {
        // Show base/unselected map image if hidden
        if (fromRegion) {
            this.unselectedMapImage
                .classList
                .remove(settings.classNames.hidden);
        }
    }

    // Update our selected index
    this.selectedRegionIndex = index;
}

/**
 * Calculates the top boundary of the current ISI tray - note
 * that we don't leverage the IsiTray class because it's
 * compiled into the TerSera javascript and won't be availble
 * to Xermelo; this isn't the greatest but the scrolling-into-
 * view is kind of a nice-to-have
 * @return {number} The top boundary of the ISI tray, if
 * present and visible, or null
 */
function getIsiTrayTop() {
    const isiTray = document.getElementById('isi-tray');
    if (!isiTray) {
        // Can't find the ISI tray
        return null;
    }

    if (!isiTray.classList.contains('isi-tray--visible')) {
        // ISI tray doesn't appear to be visible
        return null;
    }

    // Found it
    return isiTray.getBoundingClientRect().top;
}

/**
 * Same as above, but for the sticky header height
 * @return {number} The bottom boundary of the header, if
 * present and sticky, or null
 */
function getHeaderBottom() {
    const stickyHeader = document.querySelector('.header--sticky .header__fixed-container');
    if (!stickyHeader) {
        return null;
    }

    return stickyHeader.getBoundingClientRect().bottom;
}
