document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const globalToggle = document.getElementById('global-toggle');
  const presetListDiv = document.getElementById('preset-list');
  const addNewButton = document.getElementById('add-new');

  /**
   * Loads all settings from storage and renders the UI elements.
   */
  function loadAndRender() {
    chrome.storage.sync.get({
      isGloballyEnabled: true,
      activePresetId: null,
      presets: []
    }, (settings) => {
      // 1. Set the global toggle state
      if (globalToggle) {
          globalToggle.checked = settings.isGloballyEnabled;
      }

      // 2. Clear and render the preset list
      if (!presetListDiv) return; // Exit if the div isn't found

      presetListDiv.innerHTML = ''; // Clear old list

      if (settings.presets.length === 0) {
        presetListDiv.innerHTML = '<div style="padding: 10px; color: #aaa; text-align: center;">No presets found. Click "Add New Preset" to create one.</div>';
      }

      settings.presets.forEach(preset => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'preset-item';
        
        // Highlight the active preset
        if (preset.id === settings.activePresetId) {
          itemDiv.classList.add('active');
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'preset-name';
        nameSpan.textContent = preset.name;
        
        // Click on the name to set it as the active preset
        nameSpan.addEventListener('click', () => {
          setActivePreset(preset.id);
        });

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'preset-actions';

        // --- Edit Button ---
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit'; // Pencil icon
        editButton.title = 'Edit Preset';
        editButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevents setting this preset as active
          // Use local storage to pass the ID to the options page
          chrome.storage.local.set({ editPresetId: preset.id }, () => {
             chrome.runtime.openOptionsPage();
          });
        });

        // --- Delete Button ---
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete'; // Delete icon
        deleteButton.title = 'Delete Preset';
        deleteButton.classList.add('delete-button'); 
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevents setting this preset as active
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
      chrome.storage.sync.set({ isGloballyEnabled: globalToggle.checked });
    });
  }

  if (addNewButton) {
    addNewButton.addEventListener('click', () => {
      // Clear any existing 'editPresetId' flag to force New Mode
      chrome.storage.local.set({ editPresetId: null }, () => {
        chrome.runtime.openOptionsPage();
      });
    });
  }

  // ===================================
  //           DATA FUNCTIONS
  // ===================================

  function setActivePreset(presetId) {
    chrome.storage.sync.set({ activePresetId: presetId }, () => {
      loadAndRender(); 
    });
  }

  function deletePreset(presetId) {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }
    chrome.storage.sync.get({ presets: [], activePresetId: null }, (settings) => {
      const newPresets = settings.presets.filter(p => p.id !== presetId);
      let newActiveId = settings.activePresetId;
      
      // If we deleted the currently active preset, clear the active ID
      if (settings.activePresetId === presetId) {
        // Fallback: If any presets remain, set the first one as active
        newActiveId = (newPresets.length > 0) ? newPresets[0].id : null; 
      }
      
      chrome.storage.sync.set({ presets: newPresets, activePresetId: newActiveId }, () => {
        loadAndRender(); 
      });
    });
  }

  // ===================================
  //           INITIALIZATION
  // ===================================
  
  loadAndRender();

  // Re-render the popup when settings change in the options page
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes.presets || changes.activePresetId)) {
      loadAndRender();
    }
  });
});