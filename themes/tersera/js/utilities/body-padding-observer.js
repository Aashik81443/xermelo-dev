const settings = {
    cssProperties: {
        bodyRightPadding: '--body-right-padding',
    },

    classNames: {
        bodyPaddingApplied: 'body--padding-applied',
    },
};

let bodyMutationObserver = null;
let bodyRightPadding = 0;

/**
 * Monitors the <body> element to changes in its padding - this
 * occurs when scrolling is locked & unlocked and the browser
 * would display a scroll bar in the unlocked state
 */
export default class BodyPaddingObserver {
    /**
     * Indicates whether padding has been applied to the <body>
     * @return {boolean}
     */
    static get bodyPaddingApplied() {
        return bodyRightPadding > 0;
    }

    /**
     * Initializes monitoring of the <body> element
     */
    static startMonitoringBodyPadding() {
        // Stop if we're already initialized
        if (bodyMutationObserver) {
            return;
        }

        // Create Mutation Observer to monitor for changes to the body
        // element's attributes - this is to detect body-scroll-lock adding
        // padding to avoid the page shifting horizontally due to the
        // scroll bar appearing and disappearing
        bodyMutationObserver = new MutationObserver(() => {
            // Determine if the body element has right padding applied
            const newBodyRightPadding = parseInt(
                document.body.style.paddingRight,
            );

            if (!isNaN(newBodyRightPadding)) {
                if (newBodyRightPadding > 0) {
                    if (newBodyRightPadding != bodyRightPadding) {
                        // Change detected
                        if (bodyRightPadding <= 0) {
                            document.body.classList.add(
                                settings.classNames.bodyPaddingApplied,
                            );
                        }

                        bodyRightPadding = newBodyRightPadding;
                        document.body.style.setProperty(
                            settings.cssProperties.bodyRightPadding,
                            `${bodyRightPadding}px`,
                        );
                    }

                    // Stop here
                    return;
                }
            }

            // There's no right padding applied to the body - remove our
            // positioning adjustment if necessary
            if (bodyRightPadding > 0) {
                bodyRightPadding = 0;
                document.body.classList.remove(
                    settings.classNames.bodyPaddingApplied,
                );

                document.body.style.removeProperty(
                    settings.cssProperties.bodyRightPadding,
                );
            }
        });

        bodyMutationObserver.observe(
            document.body,
            {
                attributeFilter: ['style'],
            },
        );
    }
}
