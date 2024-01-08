import query from 'query-string';

// Parse the query string
export const parsedQueryString = query.parse(location.search);

/**
 * Checks the parsed query string specifically for "screenshot-mode=true"
 */
export const screenshotModeEnabled = parsedQueryString['screenshot-mode'] === 'true';

// If screenshot mode is enabled, add a class to the <body> element
if (screenshotModeEnabled) {
    document.body.classList.add('screenshot-mode');
}

/**
 * Caps floating-point values to limit the number of digits output
 * when converted to a string for CSS values
 * @param {number} value
 * @param {number} accuracy
 * @return {number}
 */
export function trimValue(value, accuracy = 1000) {
    return Math.round(value * accuracy) / accuracy;
}

/**
 * Parses JSON packed into an HTML attribute
 * @param {HTMLElement} element
 * @param {string} attributeName
 * @return {object}
 */
export function parseJsonAttribute(
    element,
    attributeName,
) {
    let jsonParameters = element.getAttribute(attributeName);
    if (jsonParameters) {
        // Replace single quotes with double quotes, otherwise it's invalid JSON
        // and will cause an error
        const pattern = /\'([^\']+)\'/;
        let match = pattern.exec(jsonParameters);
        while (match) {
            jsonParameters = jsonParameters.replace(`'${match[1]}'`, `"${match[1]}"`);
            match = pattern.exec(jsonParameters);
        }

        return JSON.parse(jsonParameters);
    } else {
        return {};
    }
}

/**
 * Returns an easing function for the given GSAP name
 * @param {string} value
 * @return {function}
 */
export function parseEasingFunctionParameter(value) {
    if (value) {
        // Parse GSAP easing name
        return gsap.parseEase(value);
    } else {
        // No easing
        return (value) => {
            return value;
        };
    }
}
