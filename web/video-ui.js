// Global array to store image files
let imageFiles = [];

// Initialize video UI components
function initVideoUI() {
  console.log("Initializing video UI components");

  if (window.debugSystem) {
    window.debugSystem.log.info('video', 'Initializing video UI components');
  }

  // Set up event handlers for video-related UI elements
  const addImageButton = document.getElementById('addImageButton');
  const distributeTimeButton = document.getElementById('distributeTimeButton');

  // Add image button click handler
  if (addImageButton) {
    addImageButton.addEventListener('click', function () {
      console.log("Add image button clicked");
      if (window.debugSystem) {
        window.debugSystem.log.debug('video', 'Add image button clicked');
      }
      addImageUpload();
    });
  } else {
    console.error("Add image button not found");
    if (window.debugSystem) {
      window.debugSystem.log.error('video', 'Add image button not found');
    }
  }

  // Distribute time button click handler
  if (distributeTimeButton) {
    distributeTimeButton.addEventListener('click', function () {
      console.log("Distribute time button clicked");
      if (window.debugSystem) {
        window.debugSystem.log.debug('video', 'Distribute time button clicked');
      }
      distributeTimeEvenly();
    });
  } else {
    console.error("Distribute time button not found");
    if (window.debugSystem) {
      window.debugSystem.log.error('video', 'Distribute time button not found');
    }
  }

  console.log("Video UI initialization complete");
  if (window.debugSystem) {
    window.debugSystem.log.info('video', 'Video UI initialization complete');
  }
}

// Add a new image upload field
function addImageUpload() {
  const imageUploadsContainer = document.getElementById('imageUploadsContainer');
  if (!imageUploadsContainer) return;

  const imageItem = document.createElement('div');
  imageItem.className = 'image-upload-item';

  // Create file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.className = 'image-file';

  // Create duration input
  const durationInput = document.createElement('input');
  durationInput.type = 'number';
  durationInput.min = '0.1';
  durationInput.step = '0.1';
  durationInput.value = '3.0';
  durationInput.className = 'image-duration';

  // Create remove button
  const removeButton = document.createElement('button');
  removeButton.textContent = '✕';
  removeButton.className = 'remove-image';
  removeButton.onclick = () => {
    imageItem.remove();
    rebuildImageFilesArray();
  };

  // Add file change handler
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      imageFiles.push({
        file: e.target.files[0],
        duration: parseFloat(durationInput.value)
      });
    }
  });

  // Add duration change handler
  durationInput.addEventListener('change', () => {
    rebuildImageFilesArray();
  });

  // Append elements
  imageItem.appendChild(fileInput);
  imageItem.appendChild(durationInput);
  imageItem.appendChild(removeButton);
  imageUploadsContainer.appendChild(imageItem);
}

// Rebuild the imageFiles array after removing an item
function rebuildImageFilesArray() {
  imageFiles = [];
  const containers = document.querySelectorAll('.image-upload-item');
  containers.forEach(container => {
    const fileInput = container.querySelector('.image-file');
    const durationInput = container.querySelector('.image-duration');
    if (fileInput.files[0]) {
      imageFiles.push({
        file: fileInput.files[0],
        duration: parseFloat(durationInput.value)
      });
    }
  });
}

// Distribute time evenly among all images
function distributeTimeEvenly() {
  const totalDuration = getTotalDuration();
  const containers = document.querySelectorAll('.image-upload-item');
  const count = containers.length;

  if (count === 0) return;

  const durationPerImage = totalDuration / count;

  containers.forEach(container => {
    const durationInput = container.querySelector('.image-duration');
    durationInput.value = durationPerImage.toFixed(1);
  });

  rebuildImageFilesArray();
}

// Get total duration from settings
function getTotalDuration() {
  const outputDuration = document.getElementById('outputDuration')?.value;
  const customDuration = document.getElementById('customDurationValue')?.value;

  if (outputDuration === 'custom' && customDuration) {
    return parseFloat(customDuration);
  }

  // Default duration if no custom value is set
  return 30.0;
}

// Read file as array buffer (for FFmpeg)
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// IMPORTANT: Export functions to global scope
window.initVideoUI = initVideoUI;
window.addImageUpload = addImageUpload;
window.distributeTimeEvenly = distributeTimeEvenly;
window.getTotalDuration = getTotalDuration;
window.readFileAsArrayBuffer = readFileAsArrayBuffer;

// Log that video-ui.js has loaded and exported functions
console.log('video-ui.js loaded and functions exported to global scope:', {
  initVideoUI: typeof window.initVideoUI === 'function',
  addImageUpload: typeof window.addImageUpload === 'function',
  distributeTimeEvenly: typeof window.distributeTimeEvenly === 'function'
});