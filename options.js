let currentPresetId = null;

function save_options() {
  const name = document.getElementById('name').value.trim();
  const prefix = document.getElementById('prefix').value; 
  const suffix = document.getElementById('suffix').value;

  if (!name) {
    alert('Preset name cannot be empty.');
    return;
  }

  // USE .local FOR 5MB LIMIT
  chrome.storage.local.get({ presets: [], activePresetId: null }, (data) => {
    const presets = data.presets;
    let newActiveId = data.activePresetId;
    
    if (currentPresetId) {
      // --- EDIT MODE ---
      const presetIndex = presets.findIndex(p => p.id === currentPresetId);
      if (presetIndex > -1) {
        presets[presetIndex] = { ...presets[presetIndex], name, prefix, suffix }; 
      }
    } else {
      // --- NEW MODE ---
      const newPreset = {
        id: `preset-${Date.now()}`,
        name: name,
        prefix: prefix,
        suffix: suffix
      };
      presets.push(newPreset);
      if (!newActiveId) {
        newActiveId = newPreset.id;
      }
    }

    // USE .local FOR 5MB LIMIT
    // Also, add an error check here for quota failures
    chrome.storage.local.set({ presets: presets, activePresetId: newActiveId }, () => {
      if (chrome.runtime.lastError) {
        // If it fails (e.g., we *still* hit the 5MB limit), tell the user.
        alert(`Error saving preset: ${chrome.runtime.lastError.message}. The text might be too large.`);
        return;
      }

      const status = document.getElementById('status');
      status.textContent = 'Preset saved.';
      status.style.opacity = '1';
      
      setTimeout(() => {
        status.style.opacity = '0'; 
        window.close();
      }, 750);
    });
  });
}

function restore_options() {
  // This file is already using .local, which is correct.
  chrome.storage.local.get('editPresetId', (data) => {
    if (data.editPresetId) {
      currentPresetId = data.editPresetId;
      document.getElementById('page-title').textContent = 'Edit Preset';

      // USE .local FOR 5MB LIMIT
      chrome.storage.local.get({ presets: [] }, (syncData) => {
        const preset = syncData.presets.find(p => p.id === currentPresetId);
        if (preset) {
          document.getElementById('name').value = preset.name;
          document.getElementById('prefix').value = preset.prefix;
          document.getElementById('suffix').value = preset.suffix;
        }
      });
      
      chrome.storage.local.remove('editPresetId');
    } else {
      document.getElementById('page-title').textContent = 'Create New Preset';
    }
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);