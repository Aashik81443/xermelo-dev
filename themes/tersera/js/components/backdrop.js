const settings = {
    classNames: {
        container: 'backdrop',
    },

    animation: {
        slowMoScale: 4,
        showDuration: 0.5,
        hideDuration: 0.5,
    },
};

/**
 * A clickable backdrop presented behind the mobile header,
 * ISI tray, modals, etc.
 */
export default class Backdrop {
    /**
     * @constructor
     * @param {Element} associatedElement
     * @param {function} clickCallback
     */
    constructor(
        associatedElement,
        clickCallback,
    ) {
        this.associatedElement = associatedElement;
        this.isVisible = false;

        // Create our div
        this.container = document.createElement('div');
        this.container.className = settings.classNames.container;

        // Setup click events
        if (clickCallback) {
            this.container.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                clickCallback(event);
            });

            this.container.addEventListener('touchstart', (event) => {
                event.preventDefault();
                event.stopPropagation();

                clickCallback(event);
            });
        }
    }

    /**
     * Shows the backdrop
     * @param {boolean} immediate
     * @param {boolean} slowMo
     */
    show(
        immediate = false,
        slowMo = false,
    ) {
        if (this.isVisible) {
            return;
        }

        this.isVisible = true;

        // Stop any ongoing animation
        if (this.showHideTimeline) {
            this.showHideTimeline.progress(1);
        }

        // Add our container to the DOM
        this.associatedElement.parentNode.insertBefore(
            this.container,
            this.associatedElement,
        );

        if (immediate) {
            // Transition immediately
            this.container.style.opacity = 1;

            // Stop here
            return;
        }

        // Animate transition
        let duration = settings.animation.showDuration;
        if (slowMo) {
            duration *= settings.animation.slowMoScale;
        }

        this.showHideTimeline = gsap.timeline();
        this.showHideTimeline.to(
            this.container,
            duration,
            {
                ease: 'power2.out',
                opacity: 1,
            },
            0,
        );

        this.showHideTimeline.add(() => {
            this.showHideTimeline = null;
        });
    }

    /**
     * Hides the backdrop
     * @param {boolean} immediate
     * @param {boolean} slowMo
     */
    hide(
        immediate = false,
        slowMo = false,
    ) {
        if (!this.isVisible) {
            return;
        }

        this.isVisible = false;

        // Stop any ongoing animation
        if (this.showHideTimeline) {
            this.showHideTimeline.progress(1);
        }

        if (immediate) {
            // Transition immediately
            this.container.parentNode.removeChild(
                this.container,
            );

            // Stop here
            return;
        }

        // Animate transition
        let duration = settings.animation.hideDuration;
        if (slowMo) {
            duration *= settings.animation.slowMoScale;
        }

        this.showHideTimeline = gsap.timeline();
        this.showHideTimeline.to(
            this.container,
            duration,
            {
                ease: 'power2.out',
                opacity: 0,
            },
            0,
        );

        this.showHideTimeline.add(() => {
            this.showHideTimeline = null;

            // Remove our container from the DOM
            this.container.parentNode.removeChild(
                this.container,
            );
        });
    }
}
