// Global variable to hold all settings
let settings = {};

// 1. Function to load all settings from storage
function loadSettings() {
  chrome.storage.sync.get({
    isGloballyEnabled: true,
    activePresetId: null,
    presets: []
  }, (items) => {
    settings = items;
  });
}

// 2. Load settings when the script first runs
loadSettings();

// 3. Listen for changes in storage (e.g., user changes preset)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    loadSettings();
  }
});

// 4. The main function to modify the prompt
function modifyPrompt() {
  // --- CORE CHECKS ---
  if (!settings.isGloballyEnabled || !settings.activePresetId) {
    return;
  }
  
  const activePreset = settings.presets.find(p => p.id === settings.activePresetId);
  if (!activePreset) {
    return; 
  }

  const prefix = activePreset.prefix;
  const suffix = activePreset.suffix;

  // Find the text box. (Selector is specific to Gemini/contenteditable)
  const textBox = document.querySelector('div[contenteditable="true"]');
  
  if (!textBox) {
    // console.warn("Gemini Injector: Could not find text box."); // Keep console output clean on non-Gemini pages
    return;
  }

  const currentText = textBox.innerText.trim();

  // Do nothing if the prompt is empty
  if (currentText === '') {
    return;
  }

  // Check if prefix/suffix are already applied
  const alreadyPrefixed = prefix && currentText.startsWith(prefix);
  const alreadySuffixed = suffix && currentText.endsWith(suffix);

  if (alreadyPrefixed && alreadySuffixed) {
    return; 
  }

  // Build the new text, preserving newlines from the stored presets
  let newText = currentText;
  if (prefix && !alreadyPrefixed) {
    newText = `${prefix}\n\n${newText}`; 
  }
  if (suffix && !alreadySuffixed) {
    newText = `${newText}\n\n${suffix}`;
  }

  // Directly set the innerText. This modifies the text box content
  textBox.innerText = newText;
}

// 5. Function to find and attach listeners
function attachListeners() {
  // Selector for the send button (might change if Google updates Gemini UI)
  const sendButtonSelector = 'button[aria-label="Send message"]';
  // Selector for the text area
  const textAreaSelector = 'div[contenteditable="true"]';

  const sendButton = document.querySelector(sendButtonSelector);
  const textArea = document.querySelector(textAreaSelector);

  if (sendButton && textArea) {
    // Attach listener to the send button (mousedown fires just before click)
    sendButton.addEventListener('mousedown', modifyPrompt, { capture: true });

    // Attach listener for the "Enter" key
    textArea.addEventListener('keydown', (event) => {
      // Check for "Enter" key, but NOT "Shift+Enter" (which creates a new line)
      if (event.key === 'Enter' && !event.shiftKey) {
        modifyPrompt();
      }
    }, { capture: true });

    // Stop the interval check once we've attached the listeners
    clearInterval(checkInterval);
  }
}

// 6. Start an interval to check for the elements (since Gemini is a Single Page App)
const checkInterval = setInterval(attachListeners, 500);