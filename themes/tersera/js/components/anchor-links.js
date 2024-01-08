import {Header} from './header/header';

/**
 * Modifies anchor links to accommodate for the height
 * of the sticky header
 */
export default class AnchorLinks {
    /**
     * Scans the DOM for anchor links and initializes them
     */
    static init() {
        // Find all anchor link elements on the DOM
        const elements = document.querySelectorAll('a[href^="#"');
        for (let i=0; i<elements.length; i++) {
            this.initElement(elements[i]);
        }

        // If the URL currently contains a hash component, check if it
        // matches the ID of an element on the page - if found, scroll
        // to the appropriate location
        window.addEventListener('load', () => {
            if (!window.location.hash) {
                return;
            }

            const id = window.location.hash.substring(1);
            const targetElement = document.getElementById(id);
            if (!targetElement) {
                return;
            }

            scrollToElement(targetElement, true);
        });
    }

    /**
     * Initializes a single anchor element; useful for any new elements
     * added to the DOM after the initial "init" call
     * @param {Element} anchorElement
     */
    static initElement(anchorElement) {
        let id = /#(?<hash>.+)$/.exec(anchorElement.href);
        if (!id) {
            return;
        }

        id = id.groups.hash;
        const targetElement = document.getElementById(id);
        if (!targetElement) {
            return;
        }

        anchorElement.addEventListener(
            'click',
            (event) => {
                event.preventDefault();
                event.stopPropagation();

                scrollToElement(targetElement);
            });
    }
}

/*
    Internal methods
*/

/**
 * Scrolls to the target
 * @param {Element} targetElement
 * @param {boolean} immediate
 */
function scrollToElement(
    targetElement,
    immediate = false,
) {
    const bounds = targetElement.getBoundingClientRect();
    let scrollTarget = window.scrollY + bounds.top;

    const header = Header.current;
    if (header) {
        // Assume that the header is or will become sticky
        scrollTarget -= header.fixedContainer.clientHeight;
    }

    if (immediate) {
        window.scrollTo(0, scrollTarget);
    } else {
        window.scrollTo({
            behavior: 'smooth',
            left: 0,
            top: scrollTarget,
        });
    }
}
