// Components
import {Modal, modalPresentationTypes} from './modal';
import Form from './form';

// Utilities
import NpiLookupApi from '../utilities/npi-lookup-api';

/**
 * @typedef {import('../utilities/npi-lookup-api').NpiLookupResult} NpiLookupResult
 */

/**
 * Callback definition for async "show" calls
 * @callback NpiLookupModalShowCallback
 * @param {NpiLookupResult} selectedResult
 */

const settings = {
    templateId: 'npi-lookup-modal',

    classNames: {
        fieldGroup: 'form__field-group',
        fieldGroupError: 'form__field-group--error',
        errorMessage: 'form__error',
        errorMessageVisible: 'form__error--visible',
        errorMessageRequired: 'form__error--required',
        errorMessageFormat: 'form__error--format',
    },

    selectors: {
        searchButton: 'input[type="submit"]',
        resultsContainer: '.npi-results',
        noResultsContainer: '.npi-no-results',
        resultsBody: '.npi-results tbody',
        resultsRecordCount: '.npi-results .record-count',
        resultRowCta: '.col-cta button',
    },

    searchProgressCopy: 'Searching...',
};

/**
 * The content HTML template for this modal, scraped from the page
 * @type {string}
 */
let contentTemplate;

/**
 * Encapsulates functionality related to the "leaving this website"
 * modal
 */
export default class NpiLookupModal extends Form {
    /**
     * @constructor
     * @param {Modal} modal
     * @param {NpiLookupModalShowCallback} callback
     */
    constructor(
        modal,
        callback,
    ) {
        // Call base class
        super(
            modal.content,
            {
                firstName: modal.content.querySelector('#npi-first-name'),
                lastName: modal.content.querySelector('#npi-last-name'),
                city: modal.content.querySelector('#npi-city'),
                state: modal.content.querySelector('#npi-state'),
            },
        );

        // Find our DOM elements
        const findDomElement = (selector) => {
            const element = this.container.querySelector(selector);
            if (!element) {
                throw new Error(`Couldn't locate "${selector}"`);
            }

            return element;
        };

        this.searchButton = findDomElement(
            settings.selectors.searchButton,
        );

        this.searchButtonDefaultCopy = this.searchButton.value;

        this.resultsContainer = findDomElement(
            settings.selectors.resultsContainer,
        );

        this.noResultsContainer = findDomElement(
            settings.selectors.noResultsContainer,
        );

        this.resultsBody = findDomElement(
            settings.selectors.resultsBody,
        );

        this.resultsRecordCount = findDomElement(
            settings.selectors.resultsRecordCount,
        );

        // Validation
        this.fields.firstName.element.addEventListener('blur', () => {
            this.validateRequiredText(this.fields.firstName);
        });

        this.fields.lastName.element.addEventListener('blur', () => {
            this.validateRequiredText(this.fields.lastName);
        });

        this.fields.state.element.addEventListener('blur', () => {
            this.validateRequiredSelect(this.fields.state);
        });

        // Setup submit
        const form = this.container.querySelector('form');
        if (!form) {
            return;
        }

        let awaitingApiResponse = false;
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            // Stop if we're waiting on an API response
            if (awaitingApiResponse) {
                return;
            }

            // Validate
            let ok = true;
            ok &= this.validateRequiredText(this.fields.firstName);
            ok &= this.validateRequiredText(this.fields.lastName);
            ok &= this.validateOptionalText(this.fields.city);
            ok &= this.validateRequiredSelect(this.fields.state);

            if (!ok) {
                // Stop here
                return;
            }

            // Success - set our API flag and submit the data
            awaitingApiResponse = true;

            // Clear our results
            clearResults.call(this);

            // Show our progress indicator
            this.searchButton.value = settings.searchProgressCopy;

            // Call the API
            NpiLookupApi.search(
                this.fields.firstName.element.value,
                this.fields.lastName.element.value,
                this.fields.city.element.value,
                this.fields.state.element.value,
                (
                    results,
                    totalCount,
                ) => {
                    // Clear our API flag
                    awaitingApiResponse = false;

                    // Reset our progress indicator
                    this.searchButton.value = this.searchButtonDefaultCopy;

                    // Set our results
                    setResults.call(
                        this,
                        results,
                        totalCount,
                        modal,
                        callback,
                    );
                },
            );
        });

        // // Testing
        // this.fields.firstName.element.value = 'Robert';
        // this.fields.lastName.element.value = 'Smith';
        // this.fields.state.element.value = 'IL';
    }

    /**
     * Locates the modal template on the DOM; does not set up any buttons
     */
    static init() {
        // Try to find our template on the DOM
        contentTemplate = document.getElementById(settings.templateId);
        if (!contentTemplate) {
            // Stop here
            return;
        }

        // Remove it from the DOM
        contentTemplate.parentNode.removeChild(contentTemplate);

        // Retain its outerHTML
        contentTemplate = contentTemplate.outerHTML;
    }

    /**
     * Presents an NPI lookup modal; the provided callback will be called if
     * a specific NPI number is selected
     * @param {NpiLookupModalShowCallback} callback
     */
    static show(
        callback,
    ) {
        // Show modal
        const modal = new Modal(
            contentTemplate,
            {
                className: 'npi-lookup-modal',
                showPresentationType: modalPresentationTypes
                    .fadeAndPartialVerticalEnvelope,
                hidePresentationType: modalPresentationTypes
                    .scaleDown,
                callbacks: {
                    preShow() {
                        new NpiLookupModal(
                            modal,
                            callback,
                        );
                    },
                },
            },
        );

        modal.show(false, event);
    }
}

/*
    Internal functions
*/

/**
 * Clears our search results display
 * @this NpiLookupModal
 */
function clearResults() {
    this.resultsContainer.removeAttribute('style');
    this.resultsRecordCount.removeAttribute('style');
    this.noResultsContainer.removeAttribute('style');

    this.resultsBody.innerHTML = '';
    this.resultsRecordCount.innerHTML = '';
}

/**
 * Sets the search results display
 * @this NpiLookupModal
 * @param {NpiLookupResult[]} results
 * @param {number?} totalCount
 * @param {Modal} modal
 * @param {NpiLookupModalShowCallback} callback
 */
function setResults(
    results = [],
    totalCount = 0,
    modal,
    callback,
) {
    if (results.length > 0 && totalCount > 0) {
        // Results are available
        results.forEach((result) => {
            const row = document.createElement('tr');
            row.className = 'npi-row';
            row.innerHTML = `
                <tr>
                    <td class="col-name">${result.fullName}</td>
                    <td class="col-npi">${result.npi}</td>
                    <td class="col-state">${result.state}</td>
                    <td class="col-zip">${result.zip}</td>
                    <td class="col-cta">
                        <button type="button">Use this NPI number</button>
                    </td>
                </tr>`;

            if (callback) {
                row.querySelector(settings.selectors.resultRowCta)
                    .addEventListener('click', (event) => {
                        event.preventDefault();

                        // Close the modal
                        modal.hide(false, event);

                        // Perform callback
                        callback(result);
                    });
            }

            this.resultsBody.appendChild(row);
        });

        // Note that the API seems to max out at 15 results but will inexplicably
        // will return less than 15 with a larger total (even 1 result with a total
        // of 2, etc.); this looks weird so we're suppressing this unless the results
        // length is ~10 or greater
        // which looks weird
        if (results.length < totalCount && results.length >= 10) {
            // More results are available
            this.resultsRecordCount.style.display = 'initial';
            this.resultsRecordCount.innerText = `Displaying first ${results.length} of ${totalCount} results found.`;
        } else {
            // These are all of the results
            this.resultsRecordCount.removeAttribute('style');
            this.resultsRecordCount.innerHTML = '';
        }

        this.resultsContainer.style.display = 'block';
        this.noResultsContainer.removeAttribute('style');
    } else {
        // No results available
        this.resultsContainer.removeAttribute('style');
        this.resultsRecordCount.removeAttribute('style');
        this.noResultsContainer.style.display = 'block';
    }
}
