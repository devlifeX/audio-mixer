// Video UI functionality

// Global variables
let isVideoMode = false;
let imageFiles = [];

// Initialize video UI components
function initVideoUI() {
  if (window.debugSystem) {
    window.debugSystem.log.info('video', 'Initializing video UI');
  }

  const modeSelector = document.getElementById('modeSelector');
  const audioOnlyRadio = document.getElementById('audioOnlyRadio');
  const videoWithImagesRadio = document.getElementById('videoWithImagesRadio');
  const imageUploadsContainer = document.getElementById('imageUploadsContainer');
  const addImageButton = document.getElementById('addImageButton');
  const distributeTimeButton = document.getElementById('distributeTimeButton');

  // Log UI elements found/not found
  if (window.debugSystem) {
    window.debugSystem.log.debug('video', 'UI elements found:', {
      modeSelector: !!modeSelector,
      audioOnlyRadio: !!audioOnlyRadio,
      videoWithImagesRadio: !!videoWithImagesRadio,
      imageUploadsContainer: !!imageUploadsContainer,
      addImageButton: !!addImageButton,
      distributeTimeButton: !!distributeTimeButton
    });
  }

  // Set default mode
  isVideoMode = videoWithImagesRadio?.checked || false;

  if (window.debugSystem) {
    window.debugSystem.log.info('video', `Initial video mode set to: ${isVideoMode ? 'Video with images' : 'Audio only'}`);
  }

  // Show/hide image uploads based on initial mode
  if (imageUploadsContainer) {
    imageUploadsContainer.style.display = isVideoMode ? 'block' : 'none';

    if (window.debugSystem) {
      window.debugSystem.log.debug('video', `Image uploads container display: ${imageUploadsContainer.style.display}`);
    }
  } else if (window.debugSystem) {
    window.debugSystem.log.error('video', 'Image uploads container element not found');
  }

  // Toggle between audio and video modes
  if (audioOnlyRadio) {
    audioOnlyRadio.addEventListener('change', () => {
      isVideoMode = false;
      if (window.debugSystem) {
        window.debugSystem.log.info('video', 'Switched to audio-only mode');
      }

      if (imageUploadsContainer) {
        imageUploadsContainer.style.display = 'none';
      }

      const videoSettingsContainer = document.getElementById('videoSettingsContainer');
      if (videoSettingsContainer) {
        videoSettingsContainer.style.display = 'none';
      }

      if (typeof checkFilesLoaded === 'function') {
        checkFilesLoaded(); // Update mix button state
      } else if (window.debugSystem) {
        window.debugSystem.log.error('video', 'checkFilesLoaded function not found');
      }
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.error('video', 'Audio-only radio button not found');
  }

  if (videoWithImagesRadio) {
    videoWithImagesRadio.addEventListener('change', () => {
      isVideoMode = true;
      if (window.debugSystem) {
        window.debugSystem.log.info('video', 'Switched to video with images mode');
      }

      if (imageUploadsContainer) {
        imageUploadsContainer.style.display = 'block';
      }

      const videoSettingsContainer = document.getElementById('videoSettingsContainer');
      if (videoSettingsContainer) {
        videoSettingsContainer.style.display = 'block';
      }

      if (typeof checkFilesLoaded === 'function') {
        checkFilesLoaded(); // Update mix button state
      } else if (window.debugSystem) {
        window.debugSystem.log.error('video', 'checkFilesLoaded function not found');
      }
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.error('video', 'Video with images radio button not found');
  }

  // Add image handler
  if (addImageButton) {
    addImageButton.addEventListener('click', () => {
      if (window.debugSystem) {
        window.debugSystem.log.info('video', 'Add image button clicked');
      }
      addImageUpload();
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.error('video', 'Add image button not found');
  }

  // Distribute time evenly among images
  if (distributeTimeButton) {
    distributeTimeButton.addEventListener('click', () => {
      if (window.debugSystem) {
        window.debugSystem.log.info('video', 'Distribute time button clicked');
      }
      distributeTimeEvenly();
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.error('video', 'Distribute time button not found');
  }

  // Add initial image upload field
  addImageUpload();

  // Add export video functionality
  const exportVideoButton = document.getElementById('exportVideoButton');
  if (exportVideoButton) {
    exportVideoButton.addEventListener('click', async () => {
      if (window.debugSystem) {
        window.debugSystem.log.info('video', 'Export Video button clicked');
      }
      try {
        // Get audio and image data
        const audioFile = document.getElementById('mainAudio').files[0];
        const settings = getSettings(); // Use settings.js to retrieve current settings

        if (!audioFile) {
          log('Please select an audio file before exporting the video.');
          if (window.debugSystem) {
            window.debugSystem.log.warn('video', 'No audio file selected');
          }
          return;
        }

        const audioData = await readFileAsArrayBuffer(audioFile); // Read audio as ArrayBuffer
        const imageDataArray = imageFiles.map(fileObj => ({
          file: fileObj.file,
          duration: fileObj.duration,
        }));

        // Call the createVideoWithWasm function
        const videoBlob = await createVideoWithWasm(audioData, imageDataArray, settings);

        // Create a download link for the video
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(videoBlob);
        downloadLink.download = `exported_video.${settings.videoFormat}`;
        downloadLink.textContent = 'Download Video';
        downloadLink.style.display = 'block';

        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
          resultContainer.innerHTML = ''; // Clear previous results
          resultContainer.appendChild(downloadLink);
          resultContainer.style.display = 'block';
        }

        log('Video exported successfully!');
        if (window.debugSystem) {
          window.debugSystem.log.info('video', 'Video exported successfully');
        }
      } catch (error) {
        console.error('Error exporting video:', error);
        log('Error exporting video: ' + error.message);
        if (window.debugSystem) {
          window.debugSystem.log.error('video', 'Error exporting video:', error);
        }
      }
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.error('video', 'Export Video button not found');
  }
  if (window.debugSystem) {
    window.debugSystem.log.info('video', 'Video UI initialization completed');
  }
}

// Add a new image upload field
function addImageUpload() {
  // ... existing code ...
}
// Rebuild the imageFiles array after removing an item
function rebuildImageFilesArray() {
  // ... existing code ...
}

// Distribute time evenly among all images
function distributeTimeEvenly() {
  // ... existing code ...
}

// Get total duration from settings
function getTotalDuration() {
  // ... existing code ...
}
// Read file as array buffer (for FFmpeg)
function readFileAsArrayBuffer(file) {
  // ... existing code ...
}

// Read file as data URL (for preview and W