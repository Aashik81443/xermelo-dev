const settings = {
    apiUrl: '/api/npi',
};

/**
 * Represents an NPI search result - structure just maps
 * to what the API returns
 * @typedef {object} NpiLookupResult
 * @property {string} npi
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} fullName
 * @property {string} address1
 * @property {string} address2
 * @property {string} city
 * @property {string} state
 * @property {string} zip
 * @property {string} phone
 * @property {string} email
 */

/**
 * Callback definition for async "lookupByNpi" calls
 * @callback NpiLookupApiLookupByNpiCallback
 * @param {NpiLookupResult} result
 */

/**
 * Callback definition for async "search" calls
 * @callback NpiLookupApiSearchCallback
 * @param {NpiLookupResult[]} results
 * @param {number} totalCount
 */

/** Encapsulates NPI lookup functionality */
export default class NpiLookupApi {
    /**
     * Searches for a result by ID
     * @param {string} npi
     * @param {NpiLookupApiLookupByNpiCallback} callback
     */
    static lookupByNpi(
        npi,
        callback = null,
    ) {
        const request = new XMLHttpRequest();
        request.open(
            'GET',
            `${settings.apiUrl}/${npi}`,
            true,
        );
        request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        request.onerror = () => {
            // Error
            handleError();
        };

        request.onload = () => {
            try {
                /** @type {NpiLookupResult} */
                const result = JSON
                    .parse(request.response)
                    .data;

                // Perform callback
                if (callback) {
                    callback(result);
                }
            } catch {
                // Error
                handleError();
            }
        };

        request.send();
    }

    /**
     * Searches for results
     * @param {string} firstName
     * @param {string} lastName
     * @param {string} city
     * @param {string} state
     * @param {NpiLookupApiSearchCallback} callback
     */
    static search(
        firstName,
        lastName,
        city,
        state,
        callback,
    ) {
        const urlSearchParams = new URLSearchParams();

        if (firstName) {
            urlSearchParams.set('first-name', firstName);
        }

        if (lastName) {
            urlSearchParams.set('last-name', lastName);
        }

        if (city) {
            urlSearchParams.set('city', city);
        }

        if (state) {
            urlSearchParams.set('state', state);
        }

        const request = new XMLHttpRequest();
        request.open(
            'GET',
            `${settings.apiUrl}?` + urlSearchParams.toString(),
            true,
        );
        request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        request.onerror = () => {
            // Error
            handleError();
        };

        request.onload = () => {
            try {
                /** @type {NpiLookupResult} */
                const results = JSON
                    .parse(request.response);

                // Perform callback
                if (callback) {
                    callback(
                        results.data,
                        results.totalCount,
                    );
                }
            } catch (error) {
                // Error
                handleError(error);
            }
        };

        request.send();
    }
}

/*
    Internal functions
*/

/**
 * Placeholder for error handling, should options become available
 * @param {Error} error
 */
function handleError(error) {
    // We don't have an error page or copy to display
    throw new Error(error);
}
