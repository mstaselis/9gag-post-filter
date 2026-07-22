function createAddObserver(targetElement, callback, options = { childList: true }) {
    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            mutation.addedNodes.forEach((addedNode) => {
                callback(addedNode);
            });
        });
    });
    observer.observe(targetElement, options);

    return observer;
}

function isValidFilterUrl(...urlFragments) {
    let result = true;

    if (urlFragments) {
        for (let arg of urlFragments) {
            result = result && !window.location.pathname.includes(arg);
        }
    }
    return result;
}

// 9gag's menu button is an <a href="javascript:void(0)">-style element: its
// own click handler opens/closes the menu, but a synthetic .click() also
// makes the browser try to follow that href, which the page's CSP blocks
// and logs as a "Running the JavaScript URL" violation. Suppressing the
// default action keeps the menu toggle working without tripping that.
function clickWithoutNavigating(element) {
    element.addEventListener("click", (event) => event.preventDefault(), { once: true });
    element.click();
}

const getNameFromMenu = async (art_id) => {
    try {
        const article = document.querySelector("#" + art_id);
        if (!article) return null;

        // Prefer the non-invasive path: read the username straight off a
        // profile link already in the post markup, no simulated clicks needed.
        const userLink = article.querySelector("a[href*='/u/']");
        if (userLink) {
            const href = userLink.getAttribute("href");
            const match = href.match(/\/u\/([^\/\?]+)/);
            if (match) return match[1];
        }

        // Fall back to opening the post's own menu and reading the name from
        // it. This simulates real clicks (and could interrupt a menu the user
        // has open), so only do it when the link lookup above found nothing.
        const popupMenu = article.querySelector(".uikit-popup-menu");
        if (popupMenu) {
            const button = popupMenu.querySelector(".button");
            if (!button) return null;

            // Click to open menu
            clickWithoutNavigating(button);

            // Wait for menu to populate with a timeout
            const menuLinks = await waitForElement(
                () => popupMenu.querySelectorAll(".menu a"),
                1000
            );

            if (menuLinks && menuLinks.length > 0) {
                const lastLink = menuLinks[menuLinks.length - 1];
                const text = lastLink.textContent || lastLink.innerText;
                const nameParts = text.split("@");
                const name = nameParts.length > 1 ? nameParts[1].trim() : null;

                // Close menu
                clickWithoutNavigating(button);
                return name;
            }

            // Close menu if we couldn't get the name
            clickWithoutNavigating(button);
            return null;
        }

        return null;
    } catch (error) {
        console.error("Error extracting username from menu:", error);
        return null;
    }
};

// Helper function to wait for an element with timeout
const waitForElement = (selector, timeout = 1000) => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = 50;

        const check = () => {
            const result = typeof selector === "function" ? selector() : document.querySelectorAll(selector);

            if (result && (result.length > 0 || result.nodeType)) {
                resolve(result);
            } else if (Date.now() - startTime >= timeout) {
                resolve(null);
            } else {
                setTimeout(check, checkInterval);
            }
        };

        check();
    });
};
