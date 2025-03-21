// Initialize settings
function initSettings() {
  if (window.debugSystem) {
    window.debugSystem.log.info('settings', 'Initializing settings');
  }

  // Get settings elements
  const videoSizeSelect = document.getElementById('videoSize');
  const videoQualitySelect = document.getElementById('videoQuality');
  const videoFormatSelect = document.getElementById('videoFormat');
  const outputDurationSelect = document.getElementById('outputDuration');
  const customDurationContainer = document.getElementById('customDurationContainer');
  const customDurationValue = document.getElementById('customDurationValue');

  // Set up event listeners for settings changes
  if (videoSizeSelect) {
    videoSizeSelect.addEventListener('change', () => {
      const selectedSize = videoSizeSelect.value;
      if (window.debugSystem) {
        window.debugSystem.log.debug('settings', `Video size changed to: ${selectedSize}`);
      }
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.warn('settings', 'Video size select element not found');
  }

  if (videoQualitySelect) {
    videoQualitySelect.addEventListener('change', () => {
      const selectedQuality = videoQualitySelect.value;
      if (window.debugSystem) {
        window.debugSystem.log.debug('settings', `Video quality changed to: ${selectedQuality}`);
      }
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.warn('settings', 'Video quality select element not found');
  }

  if (videoFormatSelect) {
    videoFormatSelect.addEventListener('change', () => {
      const selectedFormat = videoFormatSelect.value;
      if (window.debugSystem) {
        window.debugSystem.log.debug('settings', `Video format changed to: ${selectedFormat}`);
      }
      updateDownloadLinkExtension();
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.warn('settings', 'Video format select element not found');
  }

  if (outputDurationSelect) {
    outputDurationSelect.addEventListener('change', () => {
      const selectedDuration = outputDurationSelect.value;
      if (window.debugSystem) {
        window.debugSystem.log.debug('settings', `Output duration option changed to: ${selectedDuration}`);
      }

      // Show/hide custom duration input based on selection
      if (customDurationContainer) {
        customDurationContainer.style.display = selectedDuration === 'custom' ? 'block' : 'none';
        if (window.debugSystem) {
          window.debugSystem.log.debug('settings', `Custom duration container ${selectedDuration === 'custom' ? 'shown' : 'hidden'}`);
        }
      }
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.warn('settings', 'Output duration select element not found');
  }

  if (customDurationValue) {
    customDurationValue.addEventListener('change', () => {
      const duration = parseFloat(customDurationValue.value);
      if (window.debugSystem) {
        window.debugSystem.log.debug('settings', `Custom duration changed to: ${duration}s`);
      }
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.warn('settings', 'Custom duration input element not found');
  }

  // Initialize custom duration container visibility
  if (outputDurationSelect && customDurationContainer) {
    customDurationContainer.style.display = outputDurationSelect.value === 'custom' ? 'block' : 'none';
  }

  if (window.debugSystem) {
    window.debugSystem.log.info('settings', 'Settings initialization complete');
  }
}
// Get current settings
function getSettings() {
  if (window.debugSystem) {
    window.debugSystem.log.debug('settings', 'Getting current settings');
  }

  const settings = {
    videoSize: document.getElementById('videoSize')?.value || '720p',
    videoQuality: document.getElementById('videoQuality')?.value || '2',
    videoFormat: document.getElementById('videoFormat')?.value || 'mp4',
    outputDuration: document.getElementById('outputDuration')?.value || 'auto',
    customDuration: parseFloat(document.getElementById('customDurationValue')?.value) || 30.0
  };

  // Calculate width and height based on video size
  settings.width = getVideoWidth();
  settings.height = getVideoHeight();

  if (window.debugSystem) {
    window.debugSystem.log.info('settings', 'Current settings:', settings);
  }

  return settings;
}

// Get video dimensions based on selected size
function getVideoWidth() {
  const videoSize = document.getElementById('videoSize')?.value || '720p';
  let width = 1280; // Default to 720p
  switch (videoSize) {
    case '480p':
      width = 854;
      break;
    case '720p':
      width = 1280;
      break;
    case '1080p':
      width = 1920;
      break;
    case '4k':
      width = 3840;
      break;
    default:
      width = 1280;
  }

  if (window.debugSystem) {
    window.debugSystem.log.debug('settings', `Video width for ${videoSize}: ${width}px`);
  }

  return width;
}

// Get video dimensions based on selected size
function getVideoHeight() {
  const videoSize = document.getElementById('videoSize')?.value || '720p';
  let height = 720; // Default to 720p
  switch (videoSize) {
    case '480p':
      height = 480;
      break;
    case '720p':
      height = 720;
      break;
    case '1080p':
      height = 1080;
      break;
    case '4k':
      height = 2160;
      break;
    default:
      height = 720;
  }

  if (window.debugSystem) {
    window.debugSystem.log.debug('settings', `Video height for ${videoSize}: ${height}px`);
  }

  return height;
}

// Update download link extension based on selected format
function updateDownloadLinkExtension() {
  const downloadLink = document.getElementById('downloadButton');
  if (!downloadLink) {
    if (window.debugSystem) {
      window.debugSystem.log.warn('settings', 'Download link element not found');
    }
    return;
  }

  const format = document.getElementById('videoFormat')?.value || 'mp4';

  if (downloadLink.href) {
    // If there's an existing href, update its extension
    const baseUrl = downloadLink.href.split('.').slice(0, -1).join('.');
    downloadLink.href = `${baseUrl}.${format}`;

    if (window.debugSystem) {
      window.debugSystem.log.debug('settings', `Updated download link extension to .${format}`);
    }
  }
}
