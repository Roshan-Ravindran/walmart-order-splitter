
(() => {
    function extractItemsByClass() {
        const items = [];
        const elements = document.querySelectorAll('.w_vi_D');
        console.log("executing content.js");
        elements.forEach((element) => {
            const name = element.textContent.trim();
            if (name) {
                items.push(name);
            }
        });
        console.log(items);
        return items;
    }

    // Extract items and send them to the popup
    const extractedItems = extractItemsByClass();
    chrome.runtime.sendMessage({ action: 'extractedItems', data: extractedItems });
})();
