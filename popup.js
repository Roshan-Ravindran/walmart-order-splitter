function saveOrderState() {
    const orderId = getCurrentOrderId();
    if (!orderId) return;

    const orderData = {};
    for (const friend in friendsCheckboxes) {
        orderData[friend] = Array.from(friendsCheckboxes[friend])
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.dataset.itemId);
    }
    localStorage.setItem(`order-${orderId}`, JSON.stringify(orderData));
}

function loadOrderState() {
    const orderId = getCurrentOrderId();
    if (!orderId) return;

    const savedState = localStorage.getItem(`order-${orderId}`);
    if (savedState) {
        const orderData = JSON.parse(savedState);
        for (const friend in orderData) {
            orderData[friend].forEach((itemId) => {
                const checkbox = document.querySelector(`input[data-item-id="${itemId}"][data-friend="${friend}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }
}

function attachCheckboxListeners() {
    document.querySelectorAll('.friend-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', saveOrderState);
    });
}

function getCurrentOrderId() {
    const url = window.location.href;
    const match = url.match(/\/orders\/(\d+)/); // Regex to extract the order ID
    return match ? match[1] : null; // Return the order ID or null if not found
}

document.addEventListener('DOMContentLoaded', () => {
    loadOrderState(); // Load the saved state for the current order
    attachCheckboxListeners(); // Attach listeners to save changes
    const itemsList = document.getElementById('items-list');
    console.log("Executing popup.js");


    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            {
                
                target: { tabId: tabs[0].id },
                func: () => {
                    const extractItemsWithPricesAndTotals = () => {
                        const items = [];
                        const itemElements = document.querySelectorAll('.flex.flex-row');
                        itemElements.forEach((itemElement) => {
                            const nameElement = itemElement.querySelector('.w_vi_D');
                            const priceElement = itemElement.querySelector('.ml-auto .f5.b.black.tr span');
                            const name = nameElement ? nameElement.textContent.trim() : null;
                            const price = priceElement ? parseFloat(priceElement.textContent.replace('$', '').trim()) : null;
                            if (name) {
                                items.push({ name, price });
                            }
                        });

                        const subtotalElement = document.querySelector('.bill-order-payment-subtotal span');
                        const totalElement = document.querySelector('.bill-order-total-payment h2:last-of-type');
                        const subtotal = subtotalElement ? parseFloat(subtotalElement.textContent.replace('$', '').trim()) : null;
                        const total = totalElement ? parseFloat(totalElement.textContent.replace('$', '').trim()) : null;

                        return { items, subtotal, total };
                    };
                    return extractItemsWithPricesAndTotals();
                },
            },
            (results) => {



                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    itemsList.innerHTML = '<li>Error extracting items.</li>';
                    return;
                }

                const { items, subtotal, total } = results[0]?.result || {};
                itemsList.innerHTML = ''; // Clear existing list

                const friends = ['Harish', 'Danush', 'Roshan', 'Hyagiriva'];
                const friendsData = JSON.parse(localStorage.getItem('friendsData')) || {};
                const checkboxesState = JSON.parse(localStorage.getItem('checkboxesState')) || {};
                const sharesState = JSON.parse(localStorage.getItem('sharesState')) || {};


                friends.forEach((friend) => {
                    if (!friendsData[friend]) friendsData[friend] = [];
                });
                
                
                

                const updateTotals = () => {
                    friends.forEach((friend) => {
                        const friendTotal = friendsData[friend]
                            .reduce((sum, entry) => sum + parseFloat(entry.split(' - $')[1]), 0);
                        const totalDiv = document.querySelector(`#total-${friend}`);
                        if (totalDiv) totalDiv.textContent = `${friend} Total: $${friendTotal.toFixed(2)}`;
                    });
                };

                if (items && items.length > 0) {
                    items.forEach((item, index) => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'item';
                
                        // Item name and price
                        const namePrice = document.createElement('p');
                        namePrice.textContent = `${item.name} - $${item.price.toFixed(2)}`;
                        itemDiv.appendChild(namePrice);
                
                        // Friends list with checkboxes and input fields
                        const friendsDiv = document.createElement('div');
                        friendsDiv.className = 'friends';
                
                        friends.forEach((friend) => {
                            const friendDiv = document.createElement('div');
                            friendDiv.className = 'friend';
                
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.className = 'friend-checkbox';
                            checkbox.checked = checkboxesState[index]?.[friend] || false;
                
                            const label = document.createElement('label');
                            label.textContent = friend;
                
                            // Input field for share value
                            const shareInput = document.createElement('input');
                            shareInput.type = 'number';
                            shareInput.min = 1;
                            shareInput.value = sharesState[index]?.[friend] || 1; // Default share is 1
                            shareInput.className = 'friend-share';
                            shareInput.disabled = !checkbox.checked;
                
                            friendDiv.appendChild(checkbox);
                            friendDiv.appendChild(label);
                            friendDiv.appendChild(shareInput);
                
                            friendsDiv.appendChild(friendDiv);
                
                            // Event listener for checkbox change
                            checkbox.addEventListener('change', () => {
                                shareInput.disabled = !checkbox.checked;
                
                                const selectedFriends = Array.from(friendsDiv.querySelectorAll('input.friend-checkbox:checked'))
                                    .map((cb) => ({
                                        friend: cb.nextSibling.textContent,
                                        share: parseInt(cb.nextSibling.nextSibling.value) || 1,
                                    }));
                
                                checkboxesState[index] = checkboxesState[index] || {};
                                checkboxesState[index][friend] = checkbox.checked;
                
                                sharesState[index] = sharesState[index] || {};
                                if (checkbox.checked) {
                                    sharesState[index][friend] = parseInt(shareInput.value) || 1;
                                } else {
                                    delete sharesState[index][friend];
                                }
                
                                if (selectedFriends.length > 0) {
                                    const totalShares = selectedFriends.reduce((sum, f) => sum + f.share, 0);
                                    const unitPrice = item.price / totalShares;
                
                                    selectedFriends.forEach(({ friend, share }) => {
                                        const splitPrice = (unitPrice * share).toFixed(2);
                                        friendsData[friend] = friendsData[friend].filter((entry) => !entry.startsWith(item.name));
                                        friendsData[friend].push(`${item.name} - $${splitPrice}`);
                                    });
                                } else {
                                    friends.forEach((friend) => {
                                        friendsData[friend] = friendsData[friend].filter((entry) => !entry.startsWith(item.name));
                                    });
                                }
                
                                localStorage.setItem('friendsData', JSON.stringify(friendsData));
                                localStorage.setItem('checkboxesState', JSON.stringify(checkboxesState));
                                localStorage.setItem('sharesState', JSON.stringify(sharesState));
                                updateTotals();
                            });
                
                            // Event listener for share input change
                            shareInput.addEventListener('input', () => {
                                if (checkbox.checked) {
                                    sharesState[index] = sharesState[index] || {};
                                    sharesState[index][friend] = parseInt(shareInput.value) || 1;
                
                                    const selectedFriends = Array.from(friendsDiv.querySelectorAll('input.friend-checkbox:checked'))
                                        .map((cb) => ({
                                            friend: cb.nextSibling.textContent,
                                            share: parseInt(cb.nextSibling.nextSibling.value) || 1,
                                        }));
                
                                    const totalShares = selectedFriends.reduce((sum, f) => sum + f.share, 0);
                                    const unitPrice = item.price / totalShares;
                
                                    selectedFriends.forEach(({ friend, share }) => {
                                        const splitPrice = (unitPrice * share).toFixed(2);
                                        friendsData[friend] = friendsData[friend].filter((entry) => !entry.startsWith(item.name));
                                        friendsData[friend].push(`${item.name} - $${splitPrice}`);
                                    });
                
                                    localStorage.setItem('friendsData', JSON.stringify(friendsData));
                                    localStorage.setItem('sharesState', JSON.stringify(sharesState));
                                    updateTotals();
                                }
                            });
                        });
                
                        itemDiv.appendChild(friendsDiv);
                        itemsList.appendChild(itemDiv);
                    });
                } else {
                    itemsList.innerHTML = '<li>No items found.</li>';
                }
                
                // Tax Calculation and Display
                if (subtotal != null && total != null) {
                    const tax = total - subtotal;

                    const taxDiv = document.createElement('div');
                    taxDiv.className = 'tax';

                    const taxHeader = document.createElement('h3');
                    taxHeader.textContent = `Tax: $${tax.toFixed(2)}`;
                    taxDiv.appendChild(taxHeader);

                    const friendsDiv = document.createElement('div');
                    friendsDiv.className = 'friends';

                    friends.forEach((friend) => {
                        const friendDiv = document.createElement('div');
                        friendDiv.className = 'friend';

                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.className = 'friend-checkbox';
                        checkbox.checked = checkboxesState['tax']?.[friend] || false;

                        const label = document.createElement('label');
                        label.textContent = friend;

                        friendDiv.appendChild(checkbox);
                        friendDiv.appendChild(label);

                        friendsDiv.appendChild(friendDiv);

                        checkbox.addEventListener('change', () => {
                            const selectedFriends = Array.from(friendsDiv.querySelectorAll('input:checked'))
                                .map((cb) => cb.nextSibling.textContent);

                            checkboxesState['tax'] = checkboxesState['tax'] || {};
                            checkboxesState['tax'][friend] = checkbox.checked;

                            if (selectedFriends.length > 0) {
                                const splitTax = (tax / selectedFriends.length).toFixed(2);
                                selectedFriends.forEach((friend) => {
                                    friendsData[friend] = friendsData[friend].filter((entry) => !entry.startsWith('Tax'));
                                    friendsData[friend].push(`Tax - $${splitTax}`);
                                });
                            } else {
                                friends.forEach((friend) => {
                                    friendsData[friend] = friendsData[friend].filter((entry) => !entry.startsWith('Tax'));
                                });
                            }

                            localStorage.setItem('friendsData', JSON.stringify(friendsData));
                            localStorage.setItem('checkboxesState', JSON.stringify(checkboxesState));
                            updateTotals();
                        });
                    });

                    taxDiv.appendChild(friendsDiv);
                    itemsList.appendChild(taxDiv);
                } else {
                    const errorMsg = document.createElement('p');
                    errorMsg.textContent = 'Error calculating subtotal or total.';
                    itemsList.appendChild(errorMsg);
                }

                // Totals for each friend
                friends.forEach((friend) => {
                    const totalDiv = document.createElement('div');
                    totalDiv.id = `total-${friend}`;
                    totalDiv.textContent = `${friend} Total: $0.00`;
                    itemsList.appendChild(totalDiv);
                });

                updateTotals();

                // Copy Data Button
                const copyButton = document.createElement('button');
                copyButton.textContent = 'Copy Data';
                copyButton.className = 'copy-data-button';

            

                copyButton.addEventListener('click', () => {
                    let copiedText = '';
                    let totalSummary = 'Total:\n';
                
                    // Add items and their split prices for each friend
                    for (const friend in friendsData) {
                        copiedText += `${friend}:\n`;
                        copiedText += friendsData[friend].join('\n') + '\n\n';
                
                        // Calculate total for each friend
                        const friendTotal = friendsData[friend]
                            .reduce((sum, entry) => sum + parseFloat(entry.split(' - $')[1]), 0);
                        totalSummary += `${friend}: $${friendTotal.toFixed(2)}\n`;
                    }
                
                    // Append totals to the copied text
                    copiedText += totalSummary;
                
                    // Copy data to clipboard
                    navigator.clipboard.writeText(copiedText).then(() => {
                        alert('Data copied to clipboard!');
                    });
                });

                itemsList.appendChild(copyButton);


                const clearButton = document.createElement('button');
                clearButton.textContent = 'Clear Storage';
                clearButton.style.marginLeft = '30px';
                

                clearButton.addEventListener('click', () => {
                    localStorage.clear();
                    alert('Local storage cleared!');
                    //location.reload();
                });
                
                itemsList.appendChild(clearButton);

            }
        );
    });
});
