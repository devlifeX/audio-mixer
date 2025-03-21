// Settings functions module

// Initialize settings
function initSettings() {
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  const outputFormat = document.getElementById('outputFormat');
  const outputQuality = document.getElementById('outputQuality');
  const normalizeAudio = document.getElementById('normalizeAudio');
  const outputDuration = document.getElementById('outputDuration');
  const customDurationContainer = document.getElementById('customDurationContainer');
  const customDurationValue = document.getElementById('customDurationValue');

  // Load settings panel state from localStorage
  const isPanelHidden = localStorage.getItem('settingsPanelHidden') === 'true';

  // Apply initial state
  if (isPanelHidden) {
    settingsPanel.classList.add('hidden');
  } else {
    settingsPanel.classList.remove('hidden');
  }

  // Toggle settings panel visibility
  settingsToggle.addEventListener('click', () => {
    const isHidden = settingsPanel.classList.toggle('hidden');
    localStorage.setItem('settingsPanelHidden', isHidden);
  });

  // Load saved settings values if they exist
  if (localStorage.getItem('outputFormat')) {
    outputFormat.value = localStorage.getItem('outputFormat');
  }

  if (localStorage.getItem('outputQuality')) {
    outputQuality.value = localStorage.getItem('outputQuality');
  }

  if (localStorage.getItem('normalizeAudio') !== null) {
    normalizeAudio.checked = localStorage.getItem('normalizeAudio') === 'true';
  }

  if (localStorage.getItem('outputDuration')) {
    outputDuration.value = localStorage.getItem('outputDuration');
    // Show/hide custom duration input if needed
    if (outputDuration.value === 'custom') {
      customDurationContainer.style.display = 'block';
    }
  }

  if (localStorage.getItem('customDurationValue')) {
    customDurationValue.value = localStorage.getItem('customDurationValue');
  }

  // Save settings when changed
  outputFormat.addEventListener('change', () => {
    localStorage.setItem('outputFormat', outputFormat.value);
    updateDownloadLinkExtension();
  });

  outputQuality.addEventListener('change', () => {
    localStorage.setItem('outputQuality', outputQuality.value);
  });

  normalizeAudio.addEventListener('change', () => {
    localStorage.setItem('normalizeAudio', normalizeAudio.checked);
  });

  // Handle duration selection changes
  outputDuration.addEventListener('change', () => {
    localStorage.setItem('outputDuration', outputDuration.value);

    // Show/hide custom duration input
    if (outputDuration.value === 'custom') {
      customDurationContainer.style.display = 'block';
    } else {
      customDurationContainer.style.display = 'none';
    }
  });

  customDurationValue.addEventListener('change', () => {
    localStorage.setItem('customDurationValue', customDurationValue.value);
  });
}

// Update download link extension based on selected format
function updateDownloadLinkExtension() {
  const format = document.getElementById('outputFormat').value;
  const downloadLink = document.getElementById('downloadLink');
  
  if (downloadLink && downloadLink.download) {
    downloadLink.download = `mixed_audio.${format}`;
    downloadLink.textContent = `Download ${format.toUpperCase()}`;
  }
}

// Get current settings
function getSettings() {
  return {
    outputFormat: document.getElementById('outputFormat').value,
    outputQuality: document.getElementById('outputQuality').value,
    normalizeAudio: document.getElementById('normalizeAudio').checked,
    outputDuration: document.getElementById('outputDuration').value,
    customDurationValue: document.getElementById('customDurationValue').value
  };
}

export { initSettings, getSettings, updateDownloadLinkExtension };