const settings = {
    classNames: {
        selected: 'header__hamburger--selected',
    },
};

/**
 * Header hamburger button
 */
export default class Hamburger {
    /**
     * @constructor
     * @param {Element} container
     * @param {function} clickCallback
     */
    constructor(
        container,
        clickCallback,
    ) {
        this.container = container;
        this.isSelected = false;

        // Setup click event
        if (clickCallback) {
            const callback = (event) => {
                event.preventDefault();
                event.stopPropagation();

                clickCallback(event);
            };

            this.container.addEventListener('click', callback);
            this.container.addEventListener('touchstart', callback);
        }
    }

    /**
     * Sets whether the hamburger is selected
     * @param {boolean} selected
     */
    setSelectedState(selected) {
        if (selected == this.isSelected) {
            return;
        }

        this.isSelected = selected;
        if (this.isSelected) {
            this.container.classList.add(settings.classNames.selected);
        } else {
            this.container.classList.remove(settings.classNames.selected);
        }
    }
}
