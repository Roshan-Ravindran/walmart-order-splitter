# Walmart Order Splitter

## Overview

This Chrome extension extracts itemized order details from a webpage, allows users to assign items to friends, and saves the order state using local storage. It provides an easy way to split bills among friends and calculates individual totals including tax.

## Features

- Extracts order items and prices from a webpage.
- Allows users to assign items to friends using checkboxes.
- Saves order states using `localStorage`.
- Restores selections on page reload.
- Dynamically calculates item splits based on user input.
- Supports tax distribution among friends.

## Installation

1. Clone the repository or download the files.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" (toggle at the top right).
4. Click "Load unpacked" and select the extension folder.
5. The extension will now be available in your browser toolbar.

## Usage

1. Open the order page in your browser.
2. Click on the extension icon.
3. The popup will display extracted order items.
4. Assign items to friends by checking the respective checkboxes.
5. Adjust item share values if needed.
6. Tax can be split among selected friends.
7. Changes are saved automatically and persist across sessions.

## Code Breakdown

### `saveOrderState()`

Saves selected items per friend into `localStorage`.

### `loadOrderState()`

Loads the saved state from `localStorage` and restores checkbox selections.

### `attachCheckboxListeners()`

Attaches event listeners to checkboxes to update the order state in real-time.

### `getCurrentOrderId()`

Extracts the order ID from the URL using regex.

### Chrome Scripting API

- Extracts item details from the page using `chrome.scripting.executeScript`.
- Parses item names, prices, subtotal, and total.

### UI Components

- Dynamically creates checkboxes and inputs for assigning items to friends.
- Updates individual totals in real-time based on item shares.
- Handles tax distribution among friends.

## Dependencies

- Chrome Extensions API
- JavaScript (Vanilla JS, DOM Manipulation, LocalStorage API)
