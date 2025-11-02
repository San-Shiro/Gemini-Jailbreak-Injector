document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const globalToggle = document.getElementById('global-toggle');
  const presetListDiv = document.getElementById('preset-list');
  const addNewButton = document.getElementById('add-new');

  /**
   * NEW FUNCTION: Updates the extension icon based on the enabled state.
   * @param {boolean} isEnabled - The current state of the toggle.
   */
  function updateIcon(isEnabled) {
    const iconPaths = {
      "16": isEnabled ? "icon16.png" : "icon16-disabled.png",
      "48": isEnabled ? "icon48.png" : "icon48-disabled.png",
      "128": isEnabled ? "icon128.png" : "icon128-disabled.png"
    };

    chrome.action.setIcon({ path: iconPaths }, () => {
      if (chrome.runtime.lastError) {
        console.warn("Could not set icon. Are icon paths correct in manifest.json?", chrome.runtime.lastError.message);
      }
    });
  }

  /**
   * Loads all settings from storage and renders the UI elements.
   */
  function loadAndRender() {
    chrome.storage.local.get({
      isGloballyEnabled: true,
      activePresetId: null,
      presets: []
    }, (settings) => {
      // 1. Set the global toggle state
      if (globalToggle) {
          globalToggle.checked = settings.isGloballyEnabled;
      }

      // --- NEW ---
      // Update the icon to match the loaded state
      updateIcon(settings.isGloballyEnabled);
      // --- END NEW ---

      // 2. Clear and render the preset list
      if (!presetListDiv) return;
      presetListDiv.innerHTML = ''; 

      if (settings.presets.length === 0) {
        presetListDiv.innerHTML = '<div style="padding: 10px; color: #aaa; text-align: center;">No presets found. Click "Add New Preset" to create one.</div>';
      }

      settings.presets.forEach(preset => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'preset-item';
        if (preset.id === settings.activePresetId) {
          itemDiv.classList.add('active');
        }
        const nameSpan = document.createElement('span');
        nameSpan.className = 'preset-name';
        nameSpan.textContent = preset.name;
        nameSpan.addEventListener('click', () => {
          setActivePreset(preset.id);
        });
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'preset-actions';
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.title = 'Edit Preset';
        editButton.addEventListener('click', (e) => {
          e.stopPropagation();
          chrome.storage.local.set({ editPresetId: preset.id }, () => {
             chrome.runtime.openOptionsPage();
          });
        });
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.title = 'Delete Preset';
        deleteButton.classList.add('delete-button'); 
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation();
          deletePreset(preset.id);
        });
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        itemDiv.appendChild(nameSpan);
        itemDiv.appendChild(actionsDiv);
        presetListDiv.appendChild(itemDiv);
      });
    });
  }

  // ===================================
  //           EVENT HANDLERS
  // ===================================

  if (globalToggle) {
    globalToggle.addEventListener('change', () => {
      const isEnabled = globalToggle.checked;
      
      // 1. Save the new state
      chrome.storage.local.set({ isGloballyEnabled: isEnabled });
      
      // 2. --- NEW --- Update the icon
      updateIcon(isEnabled);
    });
  }

  if (addNewButton) {
    addNewButton.addEventListener('click', () => {
      chrome.storage.local.set({ editPresetId: null }, () => {
        chrome.runtime.openOptionsPage();
      });
    });
  }

  // ... (rest of the file, no changes to setActivePreset or deletePreset) ...

  function setActivePreset(presetId) {
    chrome.storage.local.set({ activePresetId: presetId }, () => {
      loadAndRender(); 
    });
  }

  function deletePreset(presetId) {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }
    chrome.storage.local.get({ presets: [], activePresetId: null }, (settings) => {
      const newPresets = settings.presets.filter(p => p.id !== presetId);
      let newActiveId = settings.activePresetId;
      if (settings.activePresetId === presetId) {
        newActiveId = (newPresets.length > 0) ? newPresets[0].id : null; 
      }
      
      chrome.storage.local.set({ presets: newPresets, activePresetId: newActiveId }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error deleting preset:', chrome.runtime.lastError.message);
        } else {
          loadAndRender(); 
        }
      });
    });
  }

  // ===================================
  //           INITIALIZATION
  // ===================================
  
  loadAndRender();

  // Re-render the popup when settings change
  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes.presets || changes.activePresetId) {
      loadAndRender();
    }
    // --- NEW ---
    // Also check if the toggle was changed from another context
    if (changes.isGloballyEnabled) {
      const newState = changes.isGloballyEnabled.newValue;
      if (globalToggle) {
        globalToggle.checked = newState;
      }
      updateIcon(newState);
    }
  });
});