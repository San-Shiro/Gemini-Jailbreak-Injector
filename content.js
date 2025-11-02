// Global variable to hold all settings
let settings = {};

// 1. Function to load all settings from storage
function loadSettings() {
  // USE .local FOR 5MB LIMIT
  chrome.storage.local.get({
    isGloballyEnabled: true,
    activePresetId: null,
    presets: []
  }, (items) => {
    settings = items;
  });
}

// 2. Load settings when the script first runs
loadSettings();

// 3. Listen for changes in storage
// USE .local FOR 5MB LIMIT
chrome.storage.local.onChanged.addListener((changes) => {
  // No namespace check needed for .local
  loadSettings();
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
    return;
  }

  const currentText = textBox.innerText.trim();

  if (currentText === '') {
    return;
  }

  const alreadyPrefixed = prefix && currentText.startsWith(prefix);
  const alreadySuffixed = suffix && currentText.endsWith(suffix);

  if (alreadyPrefixed && alreadySuffixed) {
    return; 
  }

  let newText = currentText;
  if (prefix && !alreadyPrefixed) {
    newText = `${prefix}\n\n${newText}`; 
  }
  if (suffix && !alreadySuffixed) {
    newText = `${newText}\n\n${suffix}`;
  }

  textBox.innerText = newText;
}

// 5. Function to find and attach listeners
function attachListeners() {
  const sendButtonSelector = 'button[aria-label="Send message"]';
  const textAreaSelector = 'div[contenteditable="true"]';

  const sendButton = document.querySelector(sendButtonSelector);
  const textArea = document.querySelector(textAreaSelector);

  if (sendButton && textArea) {
    sendButton.addEventListener('mousedown', modifyPrompt, { capture: true });
    textArea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        modifyPrompt();
      }
    }, { capture: true });

    clearInterval(checkInterval);
  }
}

// 6. Start an interval to check for the elements
const checkInterval = setInterval(attachListeners, 500);