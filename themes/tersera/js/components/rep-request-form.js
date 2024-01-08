// Package imports
import inputmask from 'inputmask';

// Utilities
import NpiLookupApi from '../utilities/npi-lookup-api';

// Components
import Form from './form';
import NpiLookupModal from './npi-lookup-modal';

/**
 * @typedef {import('../utilities/npi-lookup-api').NpiLookupResult} NpiLookupResult
 */

/**
 * Form settings
 */
const settings = {
    selectors: {
        container: '.form--request-a-representative',
        npiLookupTrigger: 'a.npi-lookup-modal--trigger',
    },

    // This is to accommodate for the sticky header
    errorScrollAdjustment: 160,

    // URL for submitting the data
    apiUrl: '/api/rep-request',
};

/**
 * Functionality for the "rep request" form
 */
export default class RepRequestForm extends Form {
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
                npiNumber: container.querySelector('#npi-num'),
                noNpi: container.querySelector('#no-npi'),

                firstName: container.querySelector('#first-name'),
                lastName: container.querySelector('#last-name'),
                officeAddress1: container.querySelector('#office-address-1'),
                officeAddress2: container.querySelector('#office-address-2'),
                city: container.querySelector('#city'),
                state: container.querySelector('#state'),
                zip: container.querySelector('#zipcode'),
                email: container.querySelector('#email'),
                phone: container.querySelector('#phone'),
            },
        );

        // Dictionary for caching NPI lookup results, which are
        // subsequently used for validating last names when a NPI
        // number is present
        this.npiDictionary = {};

        // Input masks
        inputmask('9999999999').mask(this.fields.npiNumber.element);
        inputmask('(999) 999-9999').mask(this.fields.phone.element);
        inputmask('99999').mask(this.fields.zip.element);

        // No NPI checkbox disables or enables associated NPI field
        const noNpiChangeCallback = () => {
            if (this.fields.noNpi.element.checked) {
                this.fields.npiNumber.element.disabled = true;

                // Clear any errors on the NPI number field
                this.clearErrors(this.fields.npiNumber.group);

                // Reset NPI number field
                this.fields.npiNumber.element.value = '';
            } else {
                this.fields.npiNumber.element.disabled = false;
            }
        };

        this.fields.noNpi.element.addEventListener('change', noNpiChangeCallback);
        noNpiChangeCallback();

        // Validation
        this.fields.npiNumber.element.addEventListener('blur', () => {
            this.validateNpi(this.fields.npiNumber, true);
        });

        this.fields.firstName.element.addEventListener('blur', () => {
            this.validateRequiredText(this.fields.firstName);
        });

        this.fields.lastName.element.addEventListener('blur', () => {
            this.validateLastName(this.fields.lastName);
        });

        this.fields.officeAddress1.element.addEventListener('blur', () => {
            this.validateRequiredText(this.fields.officeAddress1);
        });

        this.fields.city.element.addEventListener('blur', () => {
            this.validateRequiredText(this.fields.city);
        });

        this.fields.state.element.addEventListener('blur', () => {
            this.validateRequiredSelect(this.fields.state);
        });

        this.fields.zip.element.addEventListener('blur', () => {
            this.validateRequiredZip(this.fields.zip);
        });

        this.fields.email.element.addEventListener('blur', () => {
            this.validateRequiredEmail(this.fields.email);
        });

        // Setup submit event
        container.addEventListener('submit', (event) => {
            // Validate
            let ok = true;

            ok &= this.validateNpi(this.fields.npiNumber, false);
            ok &= this.validateRequiredText(this.fields.firstName);
            ok &= this.validateLastName(this.fields.lastName);
            ok &= this.validateRequiredText(this.fields.officeAddress1);
            ok &= this.validateRequiredText(this.fields.city);
            ok &= this.validateRequiredSelect(this.fields.state);
            ok &= this.validateRequiredZip(this.fields.zip);
            ok &= this.validateRequiredEmail(this.fields.email);

            if (!ok) {
                // Scroll upward so that the topmost error is onscreen
                this.scrollToTopmostError(settings.errorScrollAdjustment);

                // Stop here
                event.preventDefault();
                return;
            }

            // Success - allow the form to POST by not blocking the event
        });

        // Setup NPI lookup modal
        const npiLookupTriggers = this.container
            .querySelectorAll(settings.selectors.npiLookupTrigger);
        for (let i=0; i<npiLookupTriggers.length; i++) {
            npiLookupTriggers[i].addEventListener('click', (event) => {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                NpiLookupModal.show(
                    prepopulateForNpiLookupResult.bind(this),
                );
            });
        }

        // // Testing
        // this.fields.firstName.element.value = 'TestF';
        // this.fields.lastName.element.value = 'TestL';
        // this.fields.officeAddress1.element.value = 'Test address line 1';
        // this.fields.city.element.value = 'Chicago';
        // this.fields.state.element.value = 'IL';
        // this.fields.zip.element.value = '60654';
        // this.fields.email.element.value = 'test-xermelo@test.com';

        // NpiLookupApi.lookupByNpi(
        //     '0123',
        //     // '1013316462',
        //     (result) => {
        //         console.log(result);

        //         // ...
        //     },
        // );

        // if (npiLookupTriggers.length > 0) {
        //     npiLookupTriggers[0].click();
        // }
    }

    /**
     * Initializes the form if the associated element
     * is found on the DOM
     */
    static init() {
        // Find any forms on the page
        const containers = document
            .querySelectorAll(settings.selectors.container);

        for (let i=0; i<containers.length; i++) {
            new RepRequestForm(containers[i]);
        }
    }

    /**
     * Required text + NPI API validation - the functionality here
     * matches the rep request form seen on the Prialt site, where
     * we initially validate for the 10-digit format and build a
     * dictionary based on lookups we've made against the API.
     * This is used when validating the last name. This isn't ideal
     * but the NPI API provided takes ~5 seconds per call and async
     * validation would complicate the Pardot integration etc.
     * @param {FormField} field
     * @param {boolean} performLookup
     * @return {boolean}
     */
    validateNpi(
        field,
        performLookup,
    ) {
        // Check if the user specified they don't have an NPI number
        if (this.fields.noNpi.element.checked) {
            // Clear errors and skip validation
            this.clearErrors(field.group);

            return true;
        }

        // This clears errors
        let ok = this.validateRequiredText(field);
        if (!ok) {
            // Failure
            return false;
        }

        // Here we're only validating for a 10 digit pattern
        ok = /^\d{10}$/
            .exec(field.element.value);

        if (!ok) {
            // Failure
            this.showError(
                field.group,
                Form.classNames.errorMessageFormat,
            );

            return false;
        }

        // Success - perform a lookup if specified to do so
        // (we only do this for the live validation, not on
        // form submit)
        if (performLookup) {
            NpiLookupApi.lookupByNpi(
                field.element.value,
                (npiLookupResult) => {
                    if (!npiLookupResult) {
                        // Note that we don't show the 'invalid NPI'
                        // message, to match Prialt
                        return;
                    }

                    // Prepopulate fields & update our dictionary
                    prepopulateForNpiLookupResult.call(this, npiLookupResult);
                });
        }

        return true;
    }

    /**
     * Required text + optional NPI validation
     * @param {FormField} field
     * @return {boolean}
     */
    validateLastName(field) {
        // This clears errors
        let ok = this.validateRequiredText(field);
        if (!ok) {
            // Failure
            return false;
        }

        // Check if a NPI number is present
        if (!this.fields.noNpi.element.checked) {
            const npiNumber = this.fields.npiNumber.element.value.trim();
            if (npiNumber) {
                // Check if we've performed a successful lookup
                // on this number
                const npiLookupResult = this.npiDictionary[npiNumber];
                if (npiLookupResult) {
                    if (
                        npiLookupResult.lastName.toLowerCase() !=
                        field.element.value.toLowerCase()
                    ) {
                        // The entered last name doesn't match the
                        // value previously returned from an NPI
                        // lookup
                        ok = false;
                    }
                }
            }
        }

        if (!ok) {
            // Failure
            this.showError(
                field.group,
                Form.classNames.errorMessageNpi,
            );

            return false;
        }

        // Success
        return true;
    }
}

/*
    Internal functions
*/

/**
 * NpiLookupApiSearchCallback
 * @this RepRequestForm
 * @param {NpiLookupResult} npiLookupResult
 */
function prepopulateForNpiLookupResult(
    npiLookupResult,
) {
    if (!npiLookupResult) {
        return;
    }

    // Update our dictionary
    this.npiDictionary[npiLookupResult.npi] = npiLookupResult;

    // Fill form with provided values
    this.fields.noNpi.element.checked = false;
    this.fields.npiNumber.element.value = npiLookupResult.npi;

    if (this.fields.npiNumber.element.disabled) {
        this.fields.npiNumber.element.disabled = false;
    }

    this.fields.firstName.element.value = npiLookupResult.firstName;
    this.fields.lastName.element.value = npiLookupResult.lastName;
    this.fields.officeAddress1.element.value = npiLookupResult.address1;
    this.fields.officeAddress2.element.value = npiLookupResult.address2;
    this.fields.city.element.value = npiLookupResult.city;
    this.fields.state.element.value = npiLookupResult.state;
    this.fields.zip.element.value = npiLookupResult.zip;
    this.fields.phone.element.value = npiLookupResult.phone;

    this.clearErrors();
}
