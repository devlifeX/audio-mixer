// Initialize UI components
function initUI() {
  console.log("Initializing UI components");

  if (window.debugSystem) {
    window.debugSystem.log.info('ui', 'Initializing UI components');
  }

  // Set up event listeners for audio file inputs
  const mainAudioInput = document.getElementById('mainAudio');
  const bgAudioInput = document.getElementById('bgAudio');

  if (mainAudioInput) {
    mainAudioInput.addEventListener('change', function () {
      if (window.debugSystem) {
        window.debugSystem.log.debug('ui', 'Main audio file changed');
      }
      checkFilesLoaded();
    });
  }

  if (bgAudioInput) {
    bgAudioInput.addEventListener('change', function () {
      if (window.debugSystem) {
        window.debugSystem.log.debug('ui', 'Background audio file changed');
      }
      checkFilesLoaded();
    });
  }

  // Set up volume slider
  const volumeSlider = document.getElementById('bgVolume');
  const volumeValue = document.getElementById('volumeValue');

  if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener('input', function () {
      volumeValue.textContent = this.value + '%';
      if (window.debugSystem) {
        window.debugSystem.log.debug('ui', `Volume changed to ${this.value}%`);
      }
    });
  }

  // Set up settings toggle
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');

  if (settingsToggle && settingsPanel) {
    settingsToggle.addEventListener('click', function () {
      const isVisible = settingsPanel.style.display === 'block';
      settingsPanel.style.display = isVisible ? 'none' : 'block';
      if (window.debugSystem) {
        window.debugSystem.log.debug('ui', `Settings panel ${isVisible ? 'hidden' : 'shown'}`);
      }
    });
  }

  // Set up mode selection
  const audioOnlyRadio = document.getElementById('audioOnlyRadio');
  const videoWithImagesRadio = document.getElementById('videoWithImagesRadio');
  const imageUploadsContainer = document.getElementById('imageUploadsContainer');
  const videoSettingsContainer = document.getElementById('videoSettingsContainer');

  if (audioOnlyRadio && videoWithImagesRadio && imageUploadsContainer && videoSettingsContainer) {
    // Initial setup based on default selection
    imageUploadsContainer.style.display = audioOnlyRadio.checked ? 'none' : 'block';
    videoSettingsContainer.style.display = audioOnlyRadio.checked ? 'none' : 'block';

    // Add change listeners
    audioOnlyRadio.addEventListener('change', function () {
      if (this.checked) {
        imageUploadsContainer.style.display = 'none';
        videoSettingsContainer.style.display = 'none';

        // Update output format to audio
        const outputFormat = document.getElementById('outputFormat');
        if (outputFormat) {
          outputFormat.value = 'mp3';
        }

        if (window.debugSystem) {
          window.debugSystem.log.debug('ui', 'Switched to audio-only mode');
        }
      }
    });

    videoWithImagesRadio.addEventListener('change', function () {
      if (this.checked) {
        imageUploadsContainer.style.display = 'block';
        videoSettingsContainer.style.display = 'block';

        // Update output format to video
        const outputFormat = document.getElementById('outputFormat');
        if (outputFormat) {
          outputFormat.value = 'mp4';
        }

        if (window.debugSystem) {
          window.debugSystem.log.debug('ui', 'Switched to video with images mode');
        }
      }
    });
  }

  // Check for SharedArrayBuffer support
  if (!window.SharedArrayBuffer) {
    const sabWarning = document.getElementById('sabWarning');
    if (sabWarning) {
      sabWarning.style.display = 'block';
      if (window.debugSystem) {
        window.debugSystem.log.warn('ui', 'SharedArrayBuffer not supported in this browser');
      }
    }
  }

  console.log("UI initialization complete");
  if (window.debugSystem) {
    window.debugSystem.log.info('ui', 'UI initialization complete');
  }
}

// Check if both files are loaded to enable the mix button
function checkFilesLoaded() {
  const mainAudioInput = document.getElementById('mainAudio');
  const bgAudioInput = document.getElementById('bgAudio');
  const mixButton = document.getElementById('mixButton');

  if (!mainAudioInput || !bgAudioInput || !mixButton) {
    console.error("Required elements not found for checkFilesLoaded");
    return;
  }

  const mainAudioFile = mainAudioInput.files[0];
  const bgAudioFile = bgAudioInput.files[0];

  if (mainAudioFile && bgAudioFile) {
    mixButton.disabled = false;
    console.log("Mix button enabled - files loaded");
    if (window.debugSystem) {
      window.debugSystem.log.debug('ui', 'Mix button enabled - files loaded', {
        mainAudio: mainAudioFile.name,
        bgAudio: bgAudioFile.name
      });
    }
  } else {
    mixButton.disabled = true;
    console.log("Mix button disabled - not all files loaded");
    if (window.debugSystem) {
      window.debugSystem.log.debug('ui', 'Mix button disabled - not all files loaded');
    }
  }
}

// Export functions to global scope
window.initUI = initUI;
window.checkFilesLoaded = checkFilesLoaded;

// Log that ui.js has loaded
console.log('ui.js loaded and functions exported to global scope');