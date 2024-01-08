import {disableBodyScroll, enableBodyScroll} from 'body-scroll-lock';
import {trimValue} from '../utilities/utilities';

// Components
import Backdrop from './backdrop';

/**
 * Modal settings
 */
const settings = {
    classNames: {
        closeButton: 'modal__close-button',
        content: 'modal__content',
    },

    open: {
        duration: 0.5,
        initialScale: {
            scaleUp: 0.9,
            scaleDown: 1.15,
        },
        easing: 'power2.out',
    },

    close: {
        duration: 0.5,
        endScale: {
            scaleUp: 1.1,
            scaleDown: 0.95,
        },
        easing: 'power2.out',
    },

    minimumTimeBeforeAllowingClose: 200,
    slowMoScale: 4,

    fadeAndPartialVerticalEnvelope: {
        envelopeAmount: 0.25,
    },
};

/**
 * The base template for all modals
 * @type {string}
 */
const modalTemplate = `<div class="modal">
    <div class="${settings.classNames.closeButton}">
        <span></span>
        <span></span>
    </div>
    <div class="${settings.classNames.content}"></div>
</div>`;

/**
 * Enum for modal show/hide presentation types
 * @readonly
 * @enum {number}
 */
export const modalPresentationTypes = {
    /**
     * Simple fade in or out
     * */
    fade: 0,

    /**
     * Scale upward; initial state is smaller than normal
     * when showing, and end state is larger than normal
     * when hiding
     */
    scaleUp: 1,

    /**
     * Scale downward; initial state is larger than normal
     * when showing, and end state is smaller than normal
     * when hiding
     */
    scaleDown: 2,

    /**
     * Expand or contract vertically
     */
    verticalEnvelope: 3,

    /**
     * Expand or contract a small amount while simultaneously
     * fading in or out
     */
    fadeAndPartialVerticalEnvelope: 4,
};

/**
 * Tracks the modals that are currently visible
 * @type {Modal[]}
 */
const openModals = [];

/**
 * A modal that pops up over the underlying page content,
 * locks scrolling while visible, and incorporates a close
 * button
 */
export class Modal {
    /**
     * @constructor
     * @param {string} contentTemplate The HTML to present inside the modal
     * @param {object} options Modal options
     * @param {string} options.className A class to apply to the outer modal template
     * @param {modalPresentationTypes} options.showPresentationType The show presentation type
     * @param {modalPresentationTypes} options.hidePresentationType The hide presentation type
     * @param {object} options.callbacks Callback methods
     * @param {function} options.callbacks.preShow Executed just prior to showing the modal
     * @param {function} options.callbacks.postShow Executed just after showing the modal
     * @param {function} options.callbacks.cancel Executed when the modal closes via clicks
     * on the close button or backdrop, or when users press the escape key
     * @param {function} options.callbacks.preHide Executed just prior to hiding the modal
     * @param {function} options.callbacks.postHide Executed just after hiding the modal
     * @param {boolean} options.inhibitScrolling // Prevents the modal from scrolling
     */
    constructor(
        contentTemplate,
        options = {},
    ) {
        this.contentTemplate = contentTemplate;
        this.options = options;
        this.options.callbacks = this.options.callbacks || {};
        this.isVisible = false;

        // Setup DOM elements
        this.container = document.createElement('div');
        this.container.innerHTML = modalTemplate;
        this.container = this.container.firstChild;

        this.closeButton = this.container.querySelector(`.${settings.classNames.closeButton}`);
        this.content = this.container.querySelector(`.${settings.classNames.content}`);

        if (this.options.className) {
            this.container.classList.add(this.options.className);
        }

        // Create our backdrop & setup our close button
        this.cancelModalCallback = (event) => {
            event.preventDefault();
            event.stopPropagation();

            // Run "cancel" callback, if specified
            if (this.options.callbacks.cancel) {
                this.options.callbacks.cancel();
            }

            this.hide(false, event);
        };

        this.backdrop = new Backdrop(this.container, this.cancelModalCallback);
        this.closeButton.addEventListener('click', this.cancelModalCallback);

        // Setup escape key callback
        this.escapeKeyCallback = (event) => {
            if (event.key == 'Escape') {
                event.preventDefault();
                event.stopPropagation();

                this.cancelModalCallback(event);
            }
        };

        // Setup resize callback
        this.resizeCallback = () => {
            this.adjustContentHeight();
        };
    }

    /**
     * Returns the number of open modals
     * @return {number}
     */
    static get numberOfOpenModals() {
        return openModals.length;
    }

    /**
     * Indicates whether any open modals are scrollable
     * @return {boolean}
     */
    static get anyOpenModalContainsScrollingContent() {
        for (let i = 0; i < openModals.length; i++) {
            if (openModals[i].includesScrollingContent) {
                return true;
            }
        }

        return false;
    }

    /**
     * Shows the modal
     * @param {boolean} immediate
     * @param {Event} event
     */
    show(
        immediate = false,
        event = null,
    ) {
        // Stop if we're already visible
        if (this.isVisible) {
            return;
        }

        // Record the time when the modal was shown
        this.openStartTime = (new Date()).getTime();

        // Set our visibility flag
        this.isVisible = true;

        // Stop any ongoing animation
        if (this.timeline) {
            this.timeline.progress(1);
        }

        // Remove tabindex values from everything
        removeTabIndexes();

        // Add the content template into the modal, resetting it
        this.content.innerHTML = this.contentTemplate;

        // Append container to the end of the DOM
        this.container.style.opacity = 0;
        document.body.appendChild(this.container);

        // Run "preShow" callback, if specified
        if (this.options.callbacks.preShow) {
            this.options.callbacks.preShow();
        }

        // Add event callbacks
        window.addEventListener('keydown', this.escapeKeyCallback);
        window.addEventListener('resize', this.resizeCallback);

        // Perform initial resize
        this.resizeCallback();

        // Lock scrolling
        disableBodyScroll(
            this.content,
            {
                reserveScrollBarGap: true,
            },
        );

        // Show our backdrop
        this.backdrop.show(
            immediate,
            event ? event.shiftKey : false,
        );

        // Add this modal to the reference array
        openModals.push(this);

        const onCompleteCallback = () => {
            // this.container.style.opacity = 1;

            // Clear our timeline variable
            this.timeline = null;

            // Adjust scrolling
            this.adjustContentHeight();

            // Run "postShow" callback, if specified
            if (this.options.callbacks.postShow) {
                this.options.callbacks.postShow();
            }
        };

        // Transition immediately, if sepecified
        if (immediate) {
            onCompleteCallback();

            // Stop here
            return;
        }

        // Animate transition
        let duration = settings.open.duration;
        const progress = {
            percentComplete: 0,
        };

        // Scale duration if the shift key is pressed
        if (event) {
            if (event.shiftKey === true) {
                duration *= settings.slowMoScale;
            }
        }

        // Create timeline
        this.timeline = gsap.timeline();

        switch (this.options.showPresentationType) {
            case modalPresentationTypes.scaleUp:
                this.timeline.to(
                    progress,
                    duration,
                    {
                        ease: settings.open.easing,
                        percentComplete: 1,

                        onUpdate: () => {
                            let scale =
                                (1 - settings.open.initialScale.scaleUp) *
                                progress.percentComplete;
                            scale += settings.open.initialScale.scaleUp;
                            scale = trimValue(scale);

                            this.container
                                .style
                                .opacity = progress.percentComplete;
                            this.container
                                .style
                                .transform = `translate(-50%, -50%) scale(${scale})`;
                        },

                        onComplete: onCompleteCallback,
                    });
                break;

            case modalPresentationTypes.scaleDown:
                this.timeline.to(
                    progress,
                    duration,
                    {
                        ease: settings.open.easing,
                        percentComplete: 1,

                        onUpdate: () => {
                            let scale =
                                (1 - settings.open.initialScale.scaleDown) *
                                progress.percentComplete;
                            scale += settings.open.initialScale.scaleDown;
                            scale = trimValue(scale);

                            this.container
                                .style
                                .opacity = progress.percentComplete;
                            this.container
                                .style
                                .transform = `translate(-50%, -50%) scale(${scale})`;
                        },

                        onComplete: onCompleteCallback,
                    });
                break;

            case modalPresentationTypes.verticalEnvelope:
                {
                    const containerHeight = this.container.clientHeight;

                    this.container.style.height = '0px';
                    this.container.style.opacity = 1;

                    this.timeline.to(
                        progress,
                        duration,
                        {
                            ease: settings.open.easing,
                            percentComplete: 1,

                            onUpdate: () => {
                                const height =
                                    progress.percentComplete *
                                    containerHeight;

                                // 2 = inner content remains still
                                // > 2 = inner content shifts upward
                                // < 2 = inner content shifts downward
                                const offset =
                                    (height - containerHeight) /
                                    2.5;

                                this.container
                                    .style
                                    .height = `${height}px`;
                                this.content
                                    .style
                                    .top = `${offset}px`;

                                this.closeButton
                                    .style
                                    .transform = `translate(0px, ${offset}px)`;
                            },

                            onComplete: () => {
                                this.container.style.height = '';
                                this.content.style.top = '';
                                this.closeButton.style.transform = '';
                                onCompleteCallback();
                            },
                        });
                }
                break;

            case modalPresentationTypes.fadeAndPartialVerticalEnvelope:
                {
                    const containerHeight = this.content.clientHeight;

                    this.timeline.to(
                        progress,
                        duration,
                        {
                            ease: settings.open.easing,
                            percentComplete: 1,

                            onUpdate: () => {
                                const envelopeAmount =
                                settings
                                    .fadeAndPartialVerticalEnvelope
                                    .envelopeAmount;
                                let height =
                                    (
                                        (1 - envelopeAmount) *
                                        containerHeight
                                    ) +
                                    (
                                        envelopeAmount *
                                        containerHeight *
                                        progress.percentComplete
                                    );
                                height = trimValue(height);

                                this.container
                                    .style
                                    .opacity = progress.percentComplete;
                                this.content
                                    .style
                                    .height = `${height}px`;
                            },

                            onComplete: () => {
                                this.content.style.height = '';
                                onCompleteCallback();
                            },
                        });
                }
                break;

            // Default to fade transition
            default:
                this.timeline.to(
                    progress,
                    duration,
                    {
                        ease: settings.open.easing,
                        percentComplete: 1,

                        onUpdate: () => {
                            this.container
                                .style
                                .opacity = progress.percentComplete;
                        },

                        onComplete: onCompleteCallback,
                    });
                break;
        }
    }

    /**
     * Hides the modal
     * @param {boolean} immediate
     * @param {Event} event
     */
    hide(
        immediate = false,
        event = null,
    ) {
        // Stop if we're not visible
        if (!this.isVisible) {
            return;
        }

        // Check if the minimum amount of time has elapsed since starting
        // the animation; if it hasn't, stop here
        const elapsed = (new Date()).getTime() - this.openStartTime;
        if (elapsed < settings.minimumTimeBeforeAllowingClose) {
            return;
        }

        // Unset our visibility flag
        this.isVisible = false;

        // Stop any ongoing animation
        if (this.timeline) {
            this.timeline.progress(1);
        }

        // Remove window events
        window.removeEventListener('keydown', this.escapeKeyCallback);
        window.removeEventListener('resize', this.resizeCallback);

        // Run "preClose" callback, if specified
        if (this.options.callbacks.preClose) {
            this.options.callbacks.preClose();
        }

        // Unlock scrolling
        enableBodyScroll(this.content);

        // Hide our backdrop
        this.backdrop.hide(
            immediate,
            event ? event.shiftKey : false,
        );

        // Remove this modal from the reference array
        for (let i = 0; i < openModals.length; i++) {
            if (openModals[i] !== this) {
                continue;
            }

            openModals.splice(i, 1);
            break;
        }

        const onCompleteCallback = () => {
            // Remove our container from the DOM
            this.container.parentNode.removeChild(this.container);

            // Clear our timeline variable
            this.timeline = null;

            // Restore tabindex values
            restoreTabIndices();

            // Run "postClose" callback, if specified
            if (this.options.callbacks.postClose) {
                this.options.callbacks.postClose();
            }
        };

        // Transition immediately, if sepecified
        if (immediate) {
            onCompleteCallback();

            // Stop here
            return;
        }

        // Animate transition
        let duration = settings.close.duration;
        const progress = {
            percentComplete: 0,
        };

        // Scale duration if the shift key is pressed
        if (event) {
            if (event.shiftKey === true) {
                duration *= settings.slowMoScale;
            }
        }

        // Create timeline
        this.timeline = gsap.timeline();

        switch (this.options.hidePresentationType) {
            case modalPresentationTypes.scaleUp:
                this.timeline.to(
                    progress,
                    duration,
                    {
                        ease: settings.close.easing,
                        percentComplete: 1,

                        onUpdate: () => {
                            let scale =
                                (settings.close.endScale.scaleUp - 1) *
                                progress.percentComplete;
                            scale += 1;
                            scale = trimValue(scale);

                            this.container
                                .style
                                .opacity = 1 - progress.percentComplete;
                            this.container
                                .style
                                .transform = `translate(-50%, -50%) scale(${scale})`;
                        },

                        onComplete: onCompleteCallback,
                    });
                break;

            case modalPresentationTypes.scaleDown:
                this.timeline.to(
                    progress,
                    duration,
                    {
                        ease: settings.close.easing,
                        percentComplete: 1,

                        onUpdate: () => {
                            let scale =
                                (settings.close.endScale.scaleDown - 1) *
                                progress.percentComplete;
                            scale += 1;
                            scale = trimValue(scale);

                            this.container
                                .style
                                .opacity = 1 - progress.percentComplete;
                            this.container
                                .style
                                .transform = `translate(-50%, -50%) scale(${scale})`;
                        },

                        onComplete: onCompleteCallback,
                    });
                break;

            case modalPresentationTypes.verticalEnvelope:
                const containerHeight = this.container.clientHeight;

                this.timeline.to(
                    progress,
                    duration,
                    {
                        ease: settings.close.easing,
                        percentComplete: 1,

                        onUpdate: () => {
                            const height =
                                (1 - progress.percentComplete) *
                                containerHeight;

                            // 2 = inner content remains still
                            // > 2 = inner content shifts upward
                            // < 2 = inner content shifts downward
                            const offset = (height - containerHeight) / 2.5;

                            this.container
                                .style
                                .height = `${height}px`;
                            this.content
                                .style
                                .top = `${offset}px`;

                            this.closeButton
                                .style
                                .transform = `translate(0px, ${offset}px)`;
                        },

                        onComplete: () => {
                            this.container.style.height = '';
                            this.content.style.top = '';
                            this.closeButton.style.transform = '';

                            onCompleteCallback();
                        },
                    });
                break;

            // Default to fade transition
            default:
                this.timeline.to(
                    progress,
                    duration,
                    {
                        ease: settings.close.easing,
                        percentComplete: 1,

                        onUpdate: () => {
                            this.container
                                .style
                                .opacity = 1 - progress.percentComplete;
                        },

                        onComplete: onCompleteCallback,
                    });
                break;
        }
    }

    /**
     * Makes content scrollable if it's too tall to fit in the available space
     */
    adjustContentHeight() {
        // Stop if we're not visible
        if (!this.isVisible) {
            return;
        }

        // Reset everything
        this.container.style.top = '';
        this.container.style.height = '';
        this.container.style.transform = '';
        this.container.style.height = '';

        this.content.style.overflowY = '';
        this.content.style.height = 'auto';
        this.content.style.WebkitOverflowScrolling = 'touch';

        // Check if scrolling is enabled or not
        if (this.options.inhibitScrolling !== true) {
            // Scrolling is enabled - determine the size of the viewport
            // and the content container
            const availableHeight = this.container.clientHeight;
            const style = getComputedStyle(this.content);
            const contentHeight =
                Math.floor(
                    this.content.offsetHeight +
                    parseInt(style.marginTop) +
                    parseInt(style.marginBottom),
                ) - 1;

            if (contentHeight > availableHeight) {
                // There isn't enough space in the viewport to display all the content -
                // determine the size of the scrollable view
                const margin = contentHeight - this.content.clientHeight;
                const scrollableViewHeight = availableHeight - margin;

                this.content.style.height = `${scrollableViewHeight}px`;
                this.content.style.overflowY = 'scroll';
                this.content.style.WebkitOverflowScrolling = 'touch';

                this.includesScrollingContent = true;
            } else {
                // There is enough room on screen to present the modal without a scrollbar -
                // just set our flag
                this.includesScrollingContent = false;
            }
        } else {
            // Scrolling isn't enabled
            this.includesScrollingContent = false;
        }
    }
}

/*
    Internal methods
*/

/**
 * Temporarily disables any tabindex attributes throughout the DOM
 * TODO: update this to work with multiple nested modals
 */
function removeTabIndexes() {
    // const tabIndexElements = document.querySelectorAll('*[tabindex]');
    // for (let i = 0; i < tabIndexElements.length; i++) {
    //     const tabIndexElement = tabIndexElements[i];
    //     const tabIndex = tabIndexElement.getAttribute('tabindex');

    //     // Skip elements already out of the tabindex flow
    //     if (parseInt(tabIndex) < 0) {
    //         continue;
    //     }

    //     // Store original tab index (this would not work right if we
    //     // were to allow more than one modal onscreen at a time, I think)
    //     tabIndexElement.setAttribute('data-original-tabindex', tabIndex);
    //     tabIndexElement.setAttribute('tabindex', '-1');
    // }
}

/**
 * Restores any tabindexes disabled by removeTabIndexes
 * TODO: update this to work with multiple nested modals
 */
function restoreTabIndices() {
    // const tabIndexElements = document.querySelectorAll('*[data-original-tabindex]');
    // for (let i = 0; i < tabIndexElements.length; i++) {
    //     const tabIndexElement = tabIndexElements[i];
    //     const originalTabIndex = tabIndexElement.getAttribute('data-original-tabindex');

    //     tabIndexElement.setAttribute('tabindex', originalTabIndex);
    //     tabIndexElement.removeAttribute('data-original-tabindex');
    // }
}
