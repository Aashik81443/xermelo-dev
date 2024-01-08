// Utilities
import BodyPaddingObserver from './utilities/body-padding-observer';

// Cmponents
import {Header, headerStickyModes} from './components/header/header';
import IsiTray from './components/isi-tray';
import CookieBanner from './components/cookie-banner';
import LeavingSiteModal from './components/leaving-site-modal';
import NpiLookupModal from './components/npi-lookup-modal';
import AnchorLinks from './components/anchor-links';
import AskANurseForm from './components/ask-a-nurse-form';
import RepRequestForm from './components/rep-request-form';

// Environment-specific settings
switch (env) {
    case 'development':
        console.info(
            '%c\u2605%cDevelopment%c\u2605',
            'display: inline-block; color: #ff451a; padding: 0px 4px; background-color: #000; border-top-left-radius: 4px; border-bottom-left-radius: 4px; border: solid 1px #ff451a; border-right: none;',
            'display: inline-block; color: #fff; padding: 0px; background-color: #000; border: solid 1px #ff451a; border-left: none; border-right: none;',
            'display: inline-block; color: #ff451a; padding: 0px 4px; background-color: #000; border-top-right-radius: 4px; border-bottom-right-radius: 4px; border: solid 1px #ff451a; border-left: none;',
        );
        break;

    default:
        break;
}

// Monitor for changes in the <body> element's padding
// due to locking and unlocking scrolling, which causes
// fixed-positioned content to shift horizontally
BodyPaddingObserver.startMonitoringBodyPadding();

// Setup header
Header.init(headerStickyModes.always);

// Setup ISI tray
IsiTray.init();

// Setup cookie banner
CookieBanner.init();

// Setup modals
LeavingSiteModal.init();
NpiLookupModal.init();

// Setup anchor links
AnchorLinks.init();

// Setup forms
AskANurseForm.init();
RepRequestForm.init();

// Remove the "preload" class from any elements it's applied to
const preloadElements = document.querySelectorAll('.preload');
for (let i=0; i<preloadElements.length; i++) {
    preloadElements[i].classList.remove('preload');
}
