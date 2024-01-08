import {Cookies} from '../utilities/cookies';
import {Header} from './header/header';

const settings = {
    containerId: 'banner--cookie',
    cookie: {
        name: 'tersera-cookie-agreement',
        version: 1,

        // 100 days
        daysUntilExpiration: 100,
    },

    animation: {
        banner: {
            hideDuration: 0.5,
        },
    },
};

// Our single banner instance, created via CookieBanner.init()
let banner = null;

/**
 * The cookie agreement banner
 */
export default class CookieBanner {
    /**
     * @constructor
     */
    constructor() {
        this.timeline = null;

        // Locate our DOM elements
        this.container = document.getElementById(settings.containerId);
        if (!this.container) {
            return;
        }

        // Check if the banner has already been dismissed
        const acceptanceCookie = AcceptanceCookie.load();
        if (acceptanceCookie) {
            // The banner's already been dismissed -
            // remove the element from the DOM and stop here
            this.container.parentNode
                .removeChild(this.container);

            return;
        }

        // The banner hasn't been dismissed - show it
        this.container.style.display = 'block';

        // Notify the header that its positioning may have changed
        const header = Header.current;
        if (header) {
            header.updatePositioning();
        }

        // Setup button
        this.button = this.container.querySelector('.button');
        if (!this.button) {
            return;
        }

        this.button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            banner.accept();
        });
    }

    /**
     * Initializes the cookie banner if the associated element
     * is found on the DOM
     */
    static init() {
        // Stop if we've already initialized
        if (banner) {
            return;
        }

        banner = new CookieBanner();
    }

    /**
     * Sets a cookie acknowledging the user's agreement
     * and closes the banner, removing it from the DOM
     */
    accept() {
        // Stop if we're already animating or haven't initialized
        if (this.timeline || !this.container) {
            return;
        }

        // Hide the banner
        const header = Header.current;
        this.timeline = gsap.timeline();
        this.timeline.to(
            this.container,
            settings.animation.banner.hideDuration,
            {
                height: 0,
                ease: 'power2.out',
                onUpdate: () => {
                    // Notify the header that its positioning may have changed
                    if (header) {
                        header.updatePositioning();
                    }
                },
                onComplete: function() {
                    // Remove element from the DOM
                    this.container.parentNode
                        .removeChild(this.container);

                    // Set cookie
                    AcceptanceCookie.create();

                    // Notify the header that its positioning may have changed
                    if (header) {
                        header.updatePositioning();
                    }

                    this.timeline = null;
                    this.container = null;
                }.bind(this),
            },
        );
    }
}

/**
 * Encapsulates functionality relating to the cookie
 */
class AcceptanceCookie {
    /**
     * @constructor
     * @param {number} version
     */
    constructor(version) {
        this.version = version;
    }

    /**
     * Attempts to read the cookie if present
     * @return {AcceptanceCookie}
     */
    static load() {
        let acceptanceCookie = null;

        try {
            // Check whether the cookie is present
            let value = Cookies.read(settings.cookie.name);
            if (value) {
                // Try parsing the value as JSON
                value = JSON.parse(value);

                // Check that it contains a matching version number
                if (value.version === settings.cookie.version) {
                    // Success
                    acceptanceCookie = new AcceptanceCookie(value.version);
                } else {
                    // Version mismatch - delete the current cookie
                    AcceptanceCookie.delete();
                }
            }
        } catch {
            // Leave "acceptanceCookie" null
        }

        return acceptanceCookie;
    }

    /**
     * Creates the cookie using the configured values
     */
    static create() {
        Cookies.create(
            settings.cookie.name,
            JSON.stringify({
                version: settings.cookie.version,
            }),
            settings.cookie.daysUntilExpiration,
        );
    }

    /**
     * Removes the cookie
     */
    static delete() {
        Cookies.delete(settings.cookie.name);
    }
}
