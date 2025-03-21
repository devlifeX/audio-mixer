function initUI() {
  console.log("initUI function called");

  if (window.debugSystem) {
    window.debugSystem.log.info('ui', 'Initializing UI components');
  }

  // Set up file input listeners
  const mainAudioInput = document.getElementById('mainAudio');
  const bgAudioInput = document.getElementById('bgAudio');
  const volumeSlider = document.getElementById('bgVolume');
  const volumeValue = document.getElementById('volumeValue');
  const mixButton = document.getElementById('mixButton');
  const downloadButton = document.getElementById('downloadLink');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');

  console.log("UI elements found:", {
    mainAudioInput: !!mainAudioInput,
    bgAudioInput: !!bgAudioInput,
    volumeSlider: !!volumeSlider,
    volumeValue: !!volumeValue,
    mixButton: !!mixButton,
    downloadButton: !!downloadButton,
    settingsToggle: !!settingsToggle,
    settingsPanel: !!settingsPanel
  });

  // Settings toggle
  if (settingsToggle && settingsPanel) {
    settingsToggle.addEventListener('click', function () {
      console.log("Settings toggle clicked");
      settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
      if (window.debugSystem) {
        window.debugSystem.log.debug('ui', `Settings panel ${settingsPanel.style.display === 'block' ? 'shown' : 'hidden'}`);
      }
    });
  }

  // Main audio change handler
  if (mainAudioInput) {
    mainAudioInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (file) {
        console.log(`Main audio file selected: ${file.name}`);
        if (window.debugSystem) {
          window.debugSystem.log.info('ui', 'Main audio file selected', {
            name: file.name,
            type: file.type,
            size: file.size
          });
        }
        log(`Main audio file selected: ${file.name}`);

        if (typeof checkFilesLoaded === 'function') {
          checkFilesLoaded();
        } else {
          console.error("checkFilesLoaded function not found");
        }

        // Update audio player preview if available
        const audioPreview = document.getElementById('mainAudioPreview');
        if (audioPreview) {
          const url = URL.createObjectURL(file);
          audioPreview.src = url;
        }
      }
    });
  }

  // Background audio change handler
  if (bgAudioInput) {
    bgAudioInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (file) {
        console.log(`Background audio file selected: ${file.name}`);
        if (window.debugSystem) {
          window.debugSystem.log.info('ui', 'Background audio file selected', {
            name: file.name,
            type: file.type,
            size: file.size
          });
        }
        log(`Background audio file selected: ${file.name}`);

        if (typeof checkFilesLoaded === 'function') {
          checkFilesLoaded();
        } else {
          console.error("checkFilesLoaded function not found");
        }

        // Update audio player preview if available
        const audioPreview = document.getElementById('bgAudioPreview');
        if (audioPreview) {
          const url = URL.createObjectURL(file);
          audioPreview.src = url;
        }
      }
    });
  }
  // Volume slider handler
  if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener('input', function () {
      const value = volumeSlider.value;
      volumeValue.textContent = value + '%';
      console.log(`Volume slider changed: ${value}%`);
      if (window.debugSystem) {
        window.debugSystem.log.debug('ui', `Volume slider changed: ${value}%`);
      }
    });
  }

  // Mix button handler
  if (mixButton) {
    mixButton.addEventListener('click', function () {
      console.log("Mix button clicked");
      if (window.debugSystem) {
        window.debugSystem.log.info('ui', 'Mix button clicked');
      }

      // Disable button during processing
      mixButton.disabled = true;
      mixButton.textContent = 'Processing...';

      // Call the mix function if it exists
      if (typeof mixAudio === 'function') {
        mixAudio().catch(error => {
          console.error("Error during mixing:", error);
          if (window.debugSystem) {
            window.debugSystem.log.error('ui', 'Error during audio mixing:', error);
          }
          log(`Error during mixing: ${error.message}`);
        }).finally(() => {
          // Re-enable button after processing
          mixButton.disabled = false;
          mixButton.textContent = 'Mix Audio';
        });
      } else {
        console.error("mixAudio function not found");
        mixButton.disabled = false;
        mixButton.textContent = 'Mix Audio';
      }
    });
  }

  // Add mode switching handlers
  const audioOnlyRadio = document.getElementById('audioOnlyRadio');
  const videoWithImagesRadio = document.getElementById('videoWithImagesRadio');
  const imageUploadsContainer = document.getElementById('imageUploadsContainer');
  const videoSettingsContainer = document.getElementById('videoSettingsContainer');

  if (audioOnlyRadio) {
    audioOnlyRadio.addEventListener('change', () => {
      if (window.debugSystem) {
        window.debugSystem.log.info('ui', 'Switched to audio-only mode');
      }
      if (imageUploadsContainer) {
        imageUploadsContainer.style.display = 'none';
      }
      if (videoSettingsContainer) {
        videoSettingsContainer.style.display = 'none';
      }
    });
  }

  if (videoWithImagesRadio) {
    videoWithImagesRadio.addEventListener('change', () => {
      if (window.debugSystem) {
        window.debugSystem.log.info('ui', 'Switched to video with images mode');
      }
      if (imageUploadsContainer) {
        imageUploadsContainer.style.display = 'block';
      }
      if (videoSettingsContainer) {
        videoSettingsContainer.style.display = 'block';
      }

      // Initialize video UI if not already done
      if (typeof initVideoUI === 'function') {
        initVideoUI();
      } else {
        console.error('initVideoUI function not found');
        if (window.debugSystem) {
          window.debugSystem.log.error('ui', 'initVideoUI function not found');
        }
      }
    });
  }

  // Initial check for files
  if (typeof checkFilesLoaded === 'function') {
    checkFilesLoaded();
  } else {
    console.error("checkFilesLoaded function not found");
  }

  console.log("UI initialization complete");
  if (window.debugSystem) {
    window.debugSystem.log.info('ui', 'UI initialization complete');
  }
}