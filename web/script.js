// Global logging function
function log(message) {
  console.log(`[App] ${message}`);

  // Add to log container if it exists
  const logContainer = document.getElementById('logs');
  if (logContainer) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = message;
    logContainer.appendChild(logEntry);

    // Auto-scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // Also log to debug system if available
  if (window.debugSystem && window.debugSystem.log && window.debugSystem.log.info) {
    window.debugSystem.log.info('app', message);
  }
}

// Process the form submission based on selected mode
async function processForm() {
  if (window.debugSystem) {
    window.debugSystem.log.info('system', 'Processing form submission');
  }

  log("Process form triggered");

  // Get selected mode
  const isVideoMode = document.getElementById('videoWithImagesRadio').checked;

  if (isVideoMode) {
    log("Processing in video mode");
    await createVideoWithImages();
  } else {
    log("Processing in audio-only mode");
    await mixAudio();
  }
}

// Mix audio only
async function mixAudio() {
  if (window.debugSystem) {
    window.debugSystem.log.info('audio', 'Starting audio mix process');
  }

  const mainAudio = document.getElementById('mainAudio').files[0];
  const bgAudio = document.getElementById('bgAudio').files[0];
  const volume = document.getElementById('bgVolume').value;

  if (!mainAudio || !bgAudio) {
    log('Please select both audio files');
    return;
  }

  try {
    // Show progress container
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }

    // Read files as data URLs
    const mainAudioData = await readFileAsDataURL(mainAudio);
    const bgAudioData = await readFileAsDataURL(bgAudio);

    // Get duration setting
    const outputDuration = document.getElementById('outputDuration').value;
    let duration = null;
    if (outputDuration === 'custom') {
      duration = parseFloat(document.getElementById('customDurationValue').value);
    }

    // Mix audio using WASM
    const result = await mixAudioWithWasm(mainAudioData, bgAudioData, volume / 100, duration);

    // Update UI with result
    updateUIWithResult(result, 'audio');
    log('Audio mixing completed successfully');
  } catch (error) {
    log('Error mixing audio: ' + error.message);
    if (window.debugSystem) {
      window.debugSystem.log.error('audio', 'Error mixing audio:', error);
    }
  } finally {
    // Hide progress container
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
  }
}

// Create video with images
async function createVideoWithImages() {
  if (window.debugSystem) {
    window.debugSystem.log.info('video', 'Starting video creation process');
  }

  // Validate inputs
  const mainAudio = document.getElementById('mainAudio').files[0];
  const bgAudio = document.getElementById('bgAudio').files[0];
  const volume = document.getElementById('bgVolume').value;

  if (!mainAudio || !bgAudio) {
    log('Please select both audio files');
    return;
  }

  // Check if we have images
  if (typeof imageFiles === 'undefined' || imageFiles.length === 0) {
    log('Please add at least one image');
    return;
  }

  try {
    // Show progress container
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }

    log('Step 1/3: Reading files');
    // Read audio files as data URLs
    const mainAudioData = await readFileAsDataURL(mainAudio);
    const bgAudioData = await readFileAsDataURL(bgAudio);

    // Get settings
    const settings = getSettings();

    // Get duration setting
    const outputDuration = document.getElementById('outputDuration').value;
    if (outputDuration === 'custom') {
      settings.customDuration = parseFloat(document.getElementById('customDurationValue').value);
    }
    settings.outputDuration = outputDuration;

    log('Step 2/3: Mixing audio');
    // First mix the audio
    const mixedAudio = await mixAudioWithWasm(mainAudioData, bgAudioData, volume / 100, settings.customDuration);
    const mixedAudioData = await readBlobAsDataURL(mixedAudio);

    log('Step 3/3: Creating video with images');
    // Read all images as data URLs
    const imageDataArray = await Promise.all(imageFiles.map(async (imageFile) => {
      const imageData = await readFileAsDataURL(imageFile.file);
      return {
        data: imageData,
        duration: imageFile.duration
      };
    }));

    // Create video using WASM
    const result = await createVideoWithWasm(mixedAudioData, imageDataArray, settings);

    // Update UI with result
    updateUIWithResult(result, 'video');
    log('Video creation completed successfully');
  } catch (error) {
    log('Error creating video: ' + error.message);
    if (window.debugSystem) {
      window.debugSystem.log.error('video', 'Error creating video:', error);
    }
  } finally {
    // Hide progress container
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
  }
}

// Read file as Data URL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Read Blob as Data URL
function readBlobAsDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Mix audio only
async function mixAudio() {
  if (window.debugSystem) {
    window.debugSystem.log.info('audio', 'Starting audio mix process');
  }

  const mainAudio = document.getElementById('mainAudio').files[0];
  const bgAudio = document.getElementById('bgAudio').files[0];
  const volume = document.getElementById('bgVolume').value;

  if (!mainAudio || !bgAudio) {
    log('Please select both audio files');
    return;
  }

  try {
    // Show progress container
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }

    // Read files as data URLs
    const mainAudioData = await readFileAsDataURL(mainAudio);
    const bgAudioData = await readFileAsDataURL(bgAudio);

    // Get duration setting
    const outputDuration = document.getElementById('outputDuration').value;
    let duration = 0; // Default to 0 instead of null
    if (outputDuration === 'custom') {
      duration = parseFloat(document.getElementById('customDurationValue').value) || 0;
    }

    // Log parameters before calling WASM function
    if (window.debugSystem) {
      window.debugSystem.log.debug('audio', 'Mixing audio with parameters:', {
        mainAudioLength: mainAudioData ? mainAudioData.length : 0,
        bgAudioLength: bgAudioData ? bgAudioData.length : 0,
        volume: volume / 100,
        duration: duration
      });
    }

    // Mix audio using WASM - ensure all parameters are valid
    const result = await mixAudioWithWasm(
      mainAudioData || '',
      bgAudioData || '',
      (volume / 100) || 0,
      duration
    );

    // Update UI with result
    updateUIWithResult(result, 'audio');
    log('Audio mixing completed successfully');
  } catch (error) {
    log('Error mixing audio: ' + error.message);
    if (window.debugSystem) {
      window.debugSystem.log.error('audio', 'Error mixing audio:', error);
    }
  } finally {
    // Hide progress container
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
  }
}

// Update UI with result
function updateUIWithResult(result, type) {
  const resultContainer = document.getElementById('resultContainer');
  const resultMediaContainer = document.getElementById('resultMediaContainer');
  const downloadLink = document.getElementById('downloadLink');

  if (resultContainer && resultMediaContainer && downloadLink) {
    // Clear previous results
    resultMediaContainer.innerHTML = '';

    // Create appropriate media element
    if (type === 'audio') {
      // Create audio player for preview
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = URL.createObjectURL(result);
      resultMediaContainer.appendChild(audio);

      // Update download link
      downloadLink.href = audio.src;
      downloadLink.download = 'mixed_audio.mp3';
    } else {
      // Create video player for preview
      const video = document.createElement('video');
      video.controls = true;
      video.src = URL.createObjectURL(result);
      resultMediaContainer.appendChild(video);

      // Update download link
      downloadLink.href = video.src;
      downloadLink.download = 'video_with_images.mp4';
    }

    downloadLink.style.display = 'block';

    // Show result container
    resultContainer.style.display = 'block';
  }
}

// Main initialization function
async function init() {
  log("init() function called");

  // Prevent multiple initializations
  if (window.appInitialized) {
    log("Application already initialized, skipping");
    return;
  }

  // First, ensure debug system is initialized
  if (window.debugSystem) {
    if (typeof window.debugSystem.init === 'function') {
      window.debugSystem.init();
      log("Debug system initialized from script.js");
    }
    window.debugSystem.log.info('system', 'Initializing application');
  } else {
    log("Debug system not available");
  }

  try {
    // Initialize UI
    if (typeof initUI === 'function') {
      log("Calling initUI()");
      initUI();
      log("initUI() completed");
    } else {
      log("initUI function not found");
    }

    // Initialize settings
    if (typeof initSettings === 'function') {
      log("Calling initSettings()");
      initSettings();
      log("initSettings() completed");
    } else {
      log("initSettings function not found");
    }

    // Initialize video UI
    if (typeof initVideoUI === 'function') {
      log("Calling initVideoUI()");
      initVideoUI();
      log("initVideoUI() completed");
    } else {
      log("initVideoUI function not found");
    }

    // Initialize FFmpeg (check if it exists first)
    if (typeof initFFmpeg === 'function') {
      log("Calling initFFmpeg()");
      const ffmpegLoaded = await initFFmpeg();
      log("initFFmpeg() completed, result: " + ffmpegLoaded);
    } else {
      log("initFFmpeg function not found, skipping");
    }

    // Initialize WASM
    if (typeof initWasm === 'function') {
      log("Calling initWasm()");
      const wasmLoaded = await initWasm();
      log("initWasm() completed, result: " + wasmLoaded);
    } else {
      log("initWasm function not found");
    }

    // Add event listener to mix button
    const mixButton = document.getElementById('mixButton');
    if (mixButton) {
      // Remove any existing event listeners to prevent duplicates
      mixButton.removeEventListener('click', processForm);
      // Add fresh event listener
      mixButton.addEventListener('click', processForm);
      log("Added event listener to mix button");

      // Enable the button if both audio files are selected
      checkFilesLoaded();
    } else {
      log("Mix button not found");
    }

    // Add event listeners to mode radio buttons
    const audioOnlyRadio = document.getElementById('audioOnlyRadio');
    const videoWithImagesRadio = document.getElementById('videoWithImagesRadio');
    const imageUploadsContainer = document.getElementById('imageUploadsContainer');
    const videoSettingsContainer = document.getElementById('videoSettingsContainer');

    if (audioOnlyRadio && videoWithImagesRadio && imageUploadsContainer) {
      audioOnlyRadio.addEventListener('change', function () {
        if (this.checked) {
          imageUploadsContainer.style.display = 'none';
          if (videoSettingsContainer) videoSettingsContainer.style.display = 'none';
          log("Switched to audio-only mode");
        }
      });

      videoWithImagesRadio.addEventListener('change', function () {
        if (this.checked) {
          imageUploadsContainer.style.display = 'block';
          if (videoSettingsContainer) videoSettingsContainer.style.display = 'block';
          log("Switched to video with images mode");
        }
      });

      log("Added event listeners to mode radio buttons");
    } else {
      log("Mode radio buttons or image uploads container not found");
    }

    // Ensure imageFiles is defined
    if (typeof window.imageFiles === 'undefined') {
      window.imageFiles = [];
      log("Initialized imageFiles array");
    }

    // Mark initialization as complete
    window.appInitialized = true;
    log("Application initialization complete");
  } catch (err) {
    log('Initialization error: ' + err.message);
    if (window.debugSystem) {
      window.debugSystem.log.error('system', 'Initialization error:', err);
    }
  }
}

// Function to check if files are loaded and enable/disable mix button
function checkFilesLoaded() {
  const mainAudioInput = document.getElementById('mainAudio');
  const bgAudioInput = document.getElementById('bgAudio');
  const mixButton = document.getElementById('mixButton');

  if (!mainAudioInput || !bgAudioInput || !mixButton) {
    log("Required elements not found for checkFilesLoaded");
    return;
  }

  const mainAudioFile = mainAudioInput.files[0];
  const bgAudioFile = bgAudioInput.files[0];

  if (mainAudioFile && bgAudioFile) {
    mixButton.disabled = false;
    log("Mix button enabled - files loaded");
    if (window.debugSystem) {
      window.debugSystem.log.debug('ui', 'Mix button enabled - files loaded');
    }
  } else {
    mixButton.disabled = true;
    if (window.debugSystem) {
      window.debugSystem.log.debug('ui', 'Mix button disabled - not all files loaded');
    }
  }
}

// Export functions to global scope
window.log = log;
window.init = init;
window.mixAudio = mixAudio;
window.createVideoWithImages = createVideoWithImages;
window.processForm = processForm;
window.readFileAsDataURL = readFileAsDataURL;
window.readBlobAsDataURL = readBlobAsDataURL;
window.updateUIWithResult = updateUIWithResult;
window.checkFilesLoaded = checkFilesLoaded;

// Log that script.js has loaded
console.log('script.js loaded and functions exported to global scope');

// Add event listeners for file inputs to enable/disable mix button
document.addEventListener('DOMContentLoaded', function () {
  const mainAudioInput = document.getElementById('mainAudio');
  const bgAudioInput = document.getElementById('bgAudio');

  if (mainAudioInput) {
    mainAudioInput.addEventListener('change', checkFilesLoaded);
    if (window.debugSystem) {
      window.debugSystem.log.debug('ui', 'Added change listener to main audio input');
    }
  }

  if (bgAudioInput) {
    bgAudioInput.addEventListener('change', checkFilesLoaded);
    if (window.debugSystem) {
      window.debugSystem.log.debug('ui', 'Added change listener to background audio input');
    }
  }

  // Check if mix button exists and initialize it
  const mixButton = document.getElementById('mixButton');
  if (mixButton) {
    // Add click event listener directly here as a backup
    mixButton.addEventListener('click', function () {
      log("Mix button clicked (from DOMContentLoaded listener)");
      if (typeof window.processForm === 'function') {
        window.processForm();
      } else {
        log("Error: processForm function not available");
      }
    });

    if (window.debugSystem) {
      window.debugSystem.log.debug('ui', 'Added backup click listener to mix button');
    }
  }
});