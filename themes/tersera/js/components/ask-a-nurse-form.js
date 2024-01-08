// Package imports
import inputmask from 'inputmask';

// Components
import Form from './form';

/**
 * Form settings
 */
const settings = {
    classNames: {
        form: 'form--cne-sign-up',
    },

    // This is to accommodate for the sticky header
    errorScrollAdjustment: 120,

    // URL for submitting the data
    apiUrl: '/api/cne',

    // Thank you page redirect
    thankYouUrl: '/thank-you',
};

/**
 * Functionality for the "ask a nurse" form
 */
export default class AskANurseForm extends Form {
    /**
     * @constructor
     * @param {Element} container
     */
    constructor(
        container,
    ) {
        // Call base class
        super(
            container,
            {
                firstName: container.querySelector('#first-name'),
                lastName: container.querySelector('#last-name'),
                email: container.querySelector('#email'),
                phone: container.querySelector('#phone'),
                timeOfDay: container.querySelector('#time-of-day'),
                timeZone: container.querySelector('#time-zone'),
            },
        );

        // Phone input mask
        inputmask('(999) 999-9999').mask(this.fields.phone.element);

        // "Currently taking Xermelo" toggle
        const radioButtons = document.querySelectorAll('.form--cne-current-patient input[name="current-patient"]');
        const outerSectionContainer = this.container.closest('.cne-sign-up');
        for (const radioButton of radioButtons) {
            radioButton.addEventListener('click', function() {
                if (radioButton.value=='Yes') {
                    document.querySelector('.wrap--cne-sign-up').style.display = 'block';
                    document.querySelector('.right-for-you').style.display='none';

                    if (outerSectionContainer) {
                        outerSectionContainer.classList.remove('cne-sign-up--taking-no');
                        outerSectionContainer.classList.add('cne-sign-up--taking-yes');
                    }
                } else {
                    document.querySelector('.wrap--cne-sign-up').style.display = 'none';
                    document.querySelector('.right-for-you').style.display='block';

                    if (outerSectionContainer) {
                        outerSectionContainer.classList.add('cne-sign-up--taking-no');
                        outerSectionContainer.classList.remove('cne-sign-up--taking-yes');
                    }
                }
            });
        }

        // Validation
        this.fields.firstName.element.addEventListener('blur', () => {
            this.validateRequiredText(this.fields.firstName);
        });

        this.fields.lastName.element.addEventListener('blur', () => {
            this.validateRequiredText(this.fields.lastName);
        });

        this.fields.email.element.addEventListener('blur', () => {
            this.validateRequiredEmail(this.fields.email);
        });

        this.fields.phone.element.addEventListener('blur', () => {
            this.validateRequiredPhone(this.fields.phone);
        });

        // Only set this error if users unselect the time zone when a
        // time of day has been set
        this.fields.timeOfDay.element.addEventListener('change', () => {
            // Check if the optional time of day is set
            if (!this.fields.timeOfDay.element.value) {
                // Clear any errors on the time zone field
                this.clearErrors(this.fields.timeZone.group);
            }
        });

        this.fields.timeZone.element.addEventListener('change', () => {
            this.validateTime(this.fields.timeOfDay, this.fields.timeZone);
        });

        // Setup submit event
        let awaitingApiResponse = false;
        container.addEventListener('submit', (event) => {
            event.preventDefault();

            // Stop if we're waiting on an API response
            if (awaitingApiResponse) {
                return;
            }

            // Validate
            let ok = true;
            ok &= this.validateRequiredText(this.fields.firstName);
            ok &= this.validateRequiredText(this.fields.lastName);
            ok &= this.validateRequiredEmail(this.fields.email);
            ok &= this.validateRequiredPhone(this.fields.phone);
            ok &= this.validateTime(
                this.fields.timeOfDay,
                this.fields.timeZone,
            );

            if (!ok) {
                // Scroll upward so that the topmost error is onscreen
                this.scrollToTopmostError(settings.errorScrollAdjustment);

                // Stop here
                return;
            }

            // Success - set our API flag and submit the data
            awaitingApiResponse = true;

            const request = new XMLHttpRequest();
            request.open('POST', settings.apiUrl, true);
            request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

            request.onerror = () => {
                // Clear our API flag
                awaitingApiResponse = false;

                // If we had error content or an HTTP 500 page, we would probably redirect to it here
                // ...
            };

            request.onload = () => {
                // Clear our API flag
                awaitingApiResponse = false;

                // Check the response
                try {
                    const parsedResponse = JSON.parse(request.response);
                    if (!parsedResponse.success) {
                        throw new Error();
                    }

                    // Success
                    window.location.href = settings.thankYouUrl;
                } catch {
                    // If we had error content or an HTTP 500 page, we would probably redirect to it here
                    // ...
                }
            };

            const payload = JSON.stringify({
                firstName: this.fields.firstName.element.value,
                lastName: this.fields.lastName.element.value,
                email: this.fields.email.element.value,
                phone: this.fields.phone.element.value,
                timeOfDay: this.fields.timeOfDay.element.value,
                timeZone: this.fields.timeZone.element.value,
            });

            request.send(payload);
        });
    }

    /**
     * Initializes the form if the associated element
     * is found on the DOM
     */
    static init() {
        // Find any forms on the page
        const forms = document.getElementsByClassName(settings.classNames.form);
        for (let i=0; i<forms.length; i++) {
            new AskANurseForm(forms[i]);
        }
    }

    /**
     * Unique validation for the "time of day" and "time zone"
     * combination of inputs
     * @this {AskANurseForm}
     * @param {FormField} timeOfDayField
     * @param {FormField} timeZoneField
     * @return {boolean}
     */
    validateTime(timeOfDayField, timeZoneField) {
        // The time of day field doesn't display any errors
        this.clearErrors(timeZoneField.group);

        // First check if the optional time of day is set
        if (!timeOfDayField.element.value) {
            // Success - ignore the time zone field
            return true;
        }

        // A time of day is selected
        if (!timeZoneField.element.value) {
            // Failure
            this.showError(
                timeZoneField.group,
                Form.classNames.errorMessageRequired,
            );

            return false;
        }

        // Success
        return true;
    }
}
