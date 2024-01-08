/**
 * Base form settings
 */
const settings = {
    classNames: {
        fieldGroup: 'form__field-group',
        fieldGroupError: 'form__field-group--error',
        errorMessage: 'form__error',
        errorMessageVisible: 'form__error--visible',
        errorMessageRequired: 'form__error--required',
        errorMessageFormat: 'form__error--format',
        errorMessageNpi: 'form__error--npi',
    },
};

/**
 * @typedef {object} FormField
 * @property {Element} element
 * @property {Element} group
 */

/**
 * Base form class
 */
export default class Form {
    /**
     * @constructor
     * @param {Element} container
     * @param {object} fields
     */
    constructor(
        container,
        fields,
    ) {
        this.container = container;

        // Locate our DOM elements
        this.fields = {};
        for (const key in fields) {
            if (!Object.prototype.hasOwnProperty.call(fields, key)) {
                continue;
            }

            const element = fields[key];
            if (!element) {
                throw new Error('Couldn\'t locate field: ' + key);
            }

            const group = element.closest('.' + settings.classNames.fieldGroup);
            if (!group) {
                throw new Error('Couldn\'t locate container for field: ' + key);
            }

            this.fields[key] = {
                element: element,
                group: group,
            };
        }
    }

    /** Exposes the base settings.classNames values */
    static get classNames() {
        return settings.classNames;
    }

    /**
     * Resets all errors within a form field
     * @param {Element?} fieldGroup
     */
    clearErrors(fieldGroup) {
        if (fieldGroup) {
            fieldGroup.classList.remove(settings.classNames.fieldGroupError);

            const errors = fieldGroup.getElementsByClassName(
                settings.classNames.errorMessageVisible,
            );

            for (let i=0; i<errors.length; i++) {
                errors[i]
                    .classList
                    .remove(settings.classNames.errorMessageVisible);
            }
        } else {
            // Clear all errors
            let errors = this.container.querySelectorAll(
                `.${settings.classNames.fieldGroupError}`,
            );

            for (let i=0; i<errors.length; i++) {
                errors[i]
                    .classList
                    .remove(settings.classNames.fieldGroupError);
            }

            errors = this.container.querySelectorAll(
                `.${settings.classNames.errorMessageVisible}`,
            );

            for (let i=0; i<errors.length; i++) {
                errors[i]
                    .classList
                    .remove(settings.classNames.errorMessageVisible);
            }
        }
    }

    /**
     * Shows a specific error within a form field
     * @param {Element} fieldGroup
     * @param {string} className
     */
    showError(fieldGroup, className) {
        fieldGroup.classList.add(settings.classNames.fieldGroupError);

        const errors = fieldGroup.getElementsByClassName(className);
        for (let i=0; i<errors.length; i++) {
            errors[i].classList.add(settings.classNames.errorMessageVisible);
        }
    }

    /**
     * Scrolls to the topmost error currently onscreen
     * @param {number?} errorScrollAdjustment
     */
    scrollToTopmostError(
        errorScrollAdjustment = 120,
    ) {
        const topError = this.container.querySelector('.' + settings.classNames.errorMessageVisible);
        if (topError) {
            const errorBounds = topError.getBoundingClientRect();
            if (errorBounds.top < errorScrollAdjustment) {
                const scrollTarget = (
                    window.scrollY -
                    (
                        errorScrollAdjustment -
                        errorBounds.top
                    )
                );

                window.scrollTo({
                    behavior: 'smooth',
                    top: scrollTarget,
                });
            }
        }
    }

    /**
     * Optional text validation for input fields
     * @param {FormField} field
     * @return {boolean}
     */
    validateOptionalText(field) {
        this.clearErrors(field.group);

        const value = field.element.value.trim();
        if (!value) {
            // Success (no input provided)
            return true;
        }

        // Success
        field.element.value = value;
        return true;
    };

    /**
     * Required text validation for input fields
     * @param {FormField} field
     * @return {boolean}
     */
    validateRequiredText(field) {
        this.clearErrors(field.group);

        const value = field.element.value.trim();
        if (!value) {
            // Failure
            this.showError(
                field.group,
                settings.classNames.errorMessageRequired,
            );

            return false;
        }

        // Success
        field.element.value = value;
        return true;
    };

    /**
     * Required validation for select fields
     * @param {FormField} field
     * @return {boolean}
     */
    validateRequiredSelect(field) {
        this.clearErrors(field.group);

        if (!field.element.value) {
            // Failure
            this.showError(
                field.group,
                settings.classNames.errorMessageRequired,
            );

            return false;
        }

        // Success
        return true;
    };

    /**
     * Required text + email format validation
     * @param {FormField} field
     * @return {boolean}
     */
    validateRequiredEmail(field) {
        // This clears errors
        let ok = this.validateRequiredText(field);
        if (!ok) {
            return false;
        }

        // Pattern from AboutCarcenoid site
        ok = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            .exec(field.element.value);

        if (!ok) {
            // Failure
            this.showError(
                field.group,
                settings.classNames.errorMessageFormat,
            );

            return false;
        }

        // Success
        return true;
    }

    /**
     * Required text + phone format validation
     * @param {FormField} field
     * @return {boolean}
     */
    validateRequiredPhone(field) {
        // This clears errors
        let ok = this.validateRequiredText(field);
        if (!ok) {
            // Failure
            return false;
        }

        ok = /^\(\d{3}\) \d{3}-\d{4}$/
            .exec(field.element.value);

        if (!ok) {
            // Failure
            this.showError(
                field.group,
                settings.classNames.errorMessageFormat,
            );

            return false;
        }

        // Success
        return true;
    }

    /**
     * Required text + zip format validation
     * @param {FormField} field
     * @return {boolean}
     */
    validateRequiredZip(field) {
        // This clears errors
        let ok = this.validateRequiredText(field);
        if (!ok) {
            // Failure
            return false;
        }

        ok = /^\d{5}$/
            .exec(field.element.value);

        if (!ok) {
            // Failure
            this.showError(
                field.group,
                settings.classNames.errorMessageFormat,
            );

            return false;
        }

        // Success
        return true;
    }
}
