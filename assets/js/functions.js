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

const getNameFromMenu = async (art_id) => {
    try {
        const article = document.querySelector("#" + art_id);
        if (!article) return null;

        // Try mobile alternative - look for user link in post meta
        // This is non-intrusive and should be prioritized
        const userLink = article.querySelector("a[href*='/u/']");
        if (userLink) {
            const href = userLink.getAttribute("href");
            const match = href.match(/\/u\/([^\/\?]+)/);
            if (match) return match[1];
        }

        // Try desktop menu second - this is intrusive as it clicks elements
        const popupMenu = article.querySelector(".uikit-popup-menu");
        if (popupMenu) {
            const button = popupMenu.querySelector(".button");
            if (!button) return null;

            // Click to open menu
            button.click();

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
                button.click();
                return name;
            }

            // Close menu if we couldn't get the name
            button.click();
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
