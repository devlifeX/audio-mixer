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

  if (window.debugSystem) {
    window.debugSystem.log.info('video', 'Video UI initialization completed');
  }
}

// Add a new image upload field
function addImageUpload() {
  if (window.debugSystem) {
    window.debugSystem.log.info('video', 'Adding new image upload field');
  }

  const container = document.getElementById('imageUploadsContainer');
  if (!container) {
    if (window.debugSystem) {
      window.debugSystem.log.error('video', 'Image uploads container not found');
    }
    return;
  }

  const imageCount = container.querySelectorAll('.image-upload-item').length;
  if (window.debugSystem) {
    window.debugSystem.log.debug('video', `Current image count: ${imageCount}`);
  }

  const imageItem = document.createElement('div');
  imageItem.className = 'image-upload-item';
  imageItem.dataset.index = imageCount;

  imageItem.innerHTML = `
    <div class="image-preview-container">
      <img class="image-preview" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' text-anchor='middle' dominant-baseline='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E" alt="Preview">
    </div>
    <div class="image-upload-controls">
      <input type="file" class="image-file" accept="image/*">
      <div class="duration-container">
        <label>Duration (seconds):</label>
        <input type="number" class="image-duration" min="0.1" step="0.1" value="3.0">
      </div>
      <button type="button" class="remove-image-btn">Remove</button>
    </div>
  `;

  container.appendChild(imageItem);

  // Add event listeners to the new elements
  const fileInput = imageItem.querySelector('.image-file');
  const removeButton = imageItem.querySelector('.remove-image-btn');
  const durationInput = imageItem.querySelector('.image-duration');
  const preview = imageItem.querySelector('.image-preview');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (window.debugSystem) {
          window.debugSystem.log.info('video', `Image file selected: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
        }

        // Update the preview
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          if (window.debugSystem) {
            window.debugSystem.log.debug('video', 'Image preview updated');
          }
        };
        reader.onerror = (err) => {
          if (window.debugSystem) {
            window.debugSystem.log.error('video', 'Error reading image file:', err);
          }
        };
        reader.readAsDataURL(file);

        // Store the file in our array
        imageFiles[imageCount] = {
          file: file,
          duration: parseFloat(durationInput.value) || 3.0
        };

        if (window.debugSystem) {
          window.debugSystem.log.debug('video', `Image added to imageFiles array at index ${imageCount}`);
        }

        if (typeof checkFilesLoaded === 'function') {
          checkFilesLoaded(); // Update mix button state
        } else if (window.debugSystem) {
          window.debugSystem.log.error('video', 'checkFilesLoaded function not found');
        }
      }
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.error('video', 'File input element not found in new image item');
  }

  if (durationInput) {
    durationInput.addEventListener('change', (e) => {
      const index = parseInt(imageItem.dataset.index);
      if (imageFiles[index]) {
        const newDuration = parseFloat(e.target.value) || 3.0;
        imageFiles[index].duration = newDuration;
        if (window.debugSystem) {
          window.debugSystem.log.info('video', `Updated duration for image ${index} to ${newDuration}s`);
        }
      } else if (window.debugSystem) {
        window.debugSystem.log.warn('video', `Tried to update duration for non-existent image at index ${index}`);
      }
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.error('video', 'Duration input element not found in new image item');
  }

  if (removeButton) {
    removeButton.addEventListener('click', () => {
      if (window.debugSystem) {
        window.debugSystem.log.info('video', `Removing image at index ${imageItem.dataset.index}`);
      }
      container.removeChild(imageItem);
      // Rebuild the imageFiles array
      rebuildImageFilesArray();
      if (typeof checkFilesLoaded === 'function') {
        checkFilesLoaded(); // Update mix button state
      } else if (window.debugSystem) {
        window.debugSystem.log.error('video', 'checkFilesLoaded function not found');
      }
    });
  } else if (window.debugSystem) {
    window.debugSystem.log.error('video', 'Remove button not found in new image item');
  }
}

// Rebuild the imageFiles array after removing an item
function rebuildImageFilesArray() {
  if (window.debugSystem) {
    window.debugSystem.log.info('video', 'Rebuilding imageFiles array');
  }

  const newImageFiles = [];
  const imageItems = document.querySelectorAll('.image-upload-item');

  if (window.debugSystem) {
    window.debugSystem.log.debug('video', `Found ${imageItems.length} image items to rebuild`);
  }

  imageItems.forEach((item, index) => {
    item.dataset.index = index;
    const fileInput = item.querySelector('.image-file');
    const durationInput = item.querySelector('.image-duration');

    if (fileInput && fileInput.files[0]) {
      newImageFiles[index] = {
        file: fileInput.files[0],
        duration: parseFloat(durationInput?.value) || 3.0
      };

      if (window.debugSystem) {
        window.debugSystem.log.debug('video', `Rebuilt image at index ${index}: ${fileInput.files[0].name}, duration: ${newImageFiles[index].duration}s`);
      }
    }
  });

  imageFiles = newImageFiles;

  if (window.debugSystem) {
    window.debugSystem.log.info('video', `Rebuilt imageFiles array with ${imageFiles.length} images`);
  }
}

// Distribute time evenly among all images
function distributeTimeEvenly() {
  if (window.debugSystem) {
    window.debugSystem.log.info('video', 'Distributing time evenly among images');
  }

  const totalDuration = getTotalDuration();
  const imageItems = document.querySelectorAll('.image-upload-item');

  if (imageItems.length === 0) {
    if (window.debugSystem) {
      window.debugSystem.log.warn('video', 'No images found to distribute time');
    }
    return;
  }

  const durationPerImage = totalDuration / imageItems.length;

  if (window.debugSystem) {
    window.debugSystem.log.info('video', `Total duration: ${totalDuration}s, images: ${imageItems.length}, duration per image: ${durationPerImage.toFixed(1)}s`);
  }

  imageItems.forEach((item, index) => {
    const durationInput = item.querySelector('.image-duration');
    if (durationInput) {
      durationInput.value = durationPerImage.toFixed(1);

      if (imageFiles[index]) {
        imageFiles[index].duration = durationPerImage;
        if (window.debugSystem) {
          window.debugSystem.log.debug('video', `Updated image ${index} duration to ${durationPerImage.toFixed(1)}s`);
        }
      }
    }
  });
}

// Get total duration from settings
function getTotalDuration() {
  const outputDuration = document.getElementById('outputDuration')?.value;
  let duration = 30.0; // Default duration

  if (window.debugSystem) {
    window.debugSystem.log.debug('video', `Getting total duration, output duration setting: ${outputDuration}`);
  }

  if (outputDuration === 'custom') {
    const customDurationValue = document.getElementById('customDurationValue')?.value;
    duration = parseFloat(customDurationValue) || 30.0;

    if (window.debugSystem) {
      window.debugSystem.log.debug('video', `Using custom duration: ${duration}s`);
    }
  } else if (outputDuration === 'main') {
    // Try to get main audio duration if available
    const mainAudioElement = document.getElementById('mainAudio');
    if (mainAudioElement && !isNaN(mainAudioElement.duration) && mainAudioElement.duration > 0) {
      duration = mainAudioElement.duration;
      if (window.debugSystem) {
        window.debugSystem.log.debug('video', `Using main audio duration: ${duration}s`);
      }
    } else {
      if (window.debugSystem) {
        window.debugSystem.log.warn('video', `Could not get main audio duration, using default: ${duration}s`);
      }
    }
  } else {
    if (window.debugSystem) {
      window.debugSystem.log.debug('video', `Using default duration: ${duration}s`);
    }
  }

  return duration;
}

// Read file as array buffer (for FFmpeg)
function readFileAsArrayBuffer(file) {
  if (window.debugSystem) {
    window.debugSystem.log.debug('video', `Reading file as array buffer: ${file.name}, size: ${file.size} bytes`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (window.debugSystem) {
        window.debugSystem.log.debug('video', `Successfully read file as array buffer: ${file.name}`);
      }
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      if (window.debugSystem) {
        window.debugSystem.log.error('video', `Error reading file as array buffer: ${file.name}`, error);
      }
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
}

// Read file as data URL (for preview and W