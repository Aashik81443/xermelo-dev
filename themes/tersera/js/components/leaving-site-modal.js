import {Modal, modalPresentationTypes} from './modal';

const settings = {
    templateId: 'leaving-site-modal',
    classNames: {
        triggerElement: 'leaving-site-modal--trigger',
    },
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
export default class LeavingSiteModal {
    /**
     * Scans the DOM for links that should present the modal
     * when clicked
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

        // Find <a> elements that should trigger the interstitial
        const elements = document.querySelectorAll(`a.${settings.classNames.triggerElement}`);
        for (let i=0; i<elements.length; i++) {
            const element = elements[i];
            element.addEventListener('click', triggerElementClickCallback);
        }

        // // Testing
        // if (elements.length > 0) {
        //     elements[0].click();
        // }
    }
}

/*
    Internal methods
*/

/**
 * Click event callback for links that should present the modal
 * @param {event} event
 */
function triggerElementClickCallback(event) {
    event.preventDefault();
    event.stopPropagation();

    const href = event.target.href;

    // Show modal
    const modal = new Modal(
        contentTemplate,
        {
            className: 'leaving-site-modal',
            showPresentationType: modalPresentationTypes
                .fadeAndPartialVerticalEnvelope,
            hidePresentationType: modalPresentationTypes
                .scaleDown,
            callbacks: {
                preShow() {
                    // Setup button
                    const button = modal.content.querySelector('.button');
                    if (button) {
                        button.addEventListener('click', (event) => {
                            event.preventDefault();
                            event.stopPropagation();

                            // Navigate to the URL
                            window.open(href, '_blank');

                            // Close the modal immediately
                            modal.hide(true, event);
                        });
                    }
                },
            },
        },
    );

    modal.show(false, event);
}
