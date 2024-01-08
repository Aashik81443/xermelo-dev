/**
    Encapsulates cookie read/write functionality
*/
export class Cookies {
    /**
     * Creates a cookie
     * @param {string} name
     * @param {string} value
     * @param {number} days
     */
    static create(name, value, days) {
        let expires;

        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));

            expires = '; expires=' + date.toGMTString();
        } else {
            expires = '';
        }

        document.cookie = name + '=' + value + expires + ';path=/;SameSite=Strict';
    }

    /**
     * Loads a cookie's value
     * @param {string} name
     * @return {string} The cookie's value, or null if not present
     */
    static read(name) {
        const cookies = document.cookie.split(';');
        name = name + '=';

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            while (cookie.charAt(0) == ' ') {
                cookie = cookie.substring(1, cookie.length);
            }

            if (cookie.indexOf(name) == 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }

        return null;
    }

    /**
     * Deletes a cookie
     * @param {string} name
     */
    static delete(name) {
        Cookies.create(name, '', -1);
    }
}
