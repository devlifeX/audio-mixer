// Define log function first so it's available for other functions
function log(message) {
  console.log(message);

  // Also append to UI logs if available
  const logsElement = document.getElementById('logs');
  if (logsElement) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = message;
    logsElement.appendChild(logEntry);
    logsElement.scrollTop = logsElement.scrollHeight;
  }

  // Log through debug system if available
  if (window.debugSystem) {
    window.debugSystem.log.info('system', message);
  }
}

// Check if both files are loaded to enable the mix button
function checkFilesLoaded() {
  log("checkFilesLoaded function called");

  const mainAudioInput = document.getElementById('mainAudio');
  const bgAudioInput = document.getElementById('bgAudio');
  const mixButton = document.getElementById('mixButton');

  if (!mainAudioInput || !bgAudioInput || !mixButton) {
    log("Required elements not found for checkFilesLoaded");
    return;
  }

  const mainAudioFile = mainAudioInput.files[0];
  const bgAudioFile = bgAudioInput.files[0];

  if (mainAudioFile || bgAudioFile) {
    mixButton.disabled = false;
    log("Mix button enabled - files loaded");
    if (window.debugSystem) {
      window.debugSystem.log.debug('ui', 'Mix button enabled - files loaded', {
        mainAudio: mainAudioFile ? mainAudioFile.name : 'none',
        bgAudio: bgAudioFile ? bgAudioFile.name : 'none'
      });
    }
  } else {
    mixButton.disabled = true;
    log("Mix button disabled - no files loaded");
    if (window.debugSystem) {
      window.debugSystem.log.debug('ui', 'Mix button disabled - no files loaded');
    }
  }
}

// Initialize FFmpeg
async function initFFmpeg() {
  if (window.debugSystem) {
    window.debugSystem.log.info('ffmpeg', 'Initializing FFmpeg');
  }

  try {
    // Create FFmpeg instance if available
    if (typeof createFFmpeg === 'function') {
      const ffmpeg = createFFmpeg({
        log: true,
        progress: ({ ratio }) => {
          const progressBar = document.getElementById('progressBar');
          const progressText = document.getElementById('progressText');
          if (progressBar && progressText) {
            const percent = Math.round(ratio * 100);
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `Processing: ${percent}%`;
          }
        }
      });

      // Load FFmpeg
      await ffmpeg.load();
      window.ffmpeg = ffmpeg; // Store FFmpeg instance globally

      log('FFmpeg initialized successfully');
      return true;
    } else {
      log('createFFmpeg function not available');
      return false;
    }
  } catch (error) {
    log('Error initializing FFmpeg: ' + error.message);
    if (window.debugSystem) {
      window.debugSystem.log.error('ffmpeg', 'Error initializing FFmpeg:', error);
    }
    return false;
  }
}

// Main application initialization function
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
      if (window.debugSystem) {
        window.debugSystem.log.info('ui', 'UI initialized');
      }
    } else {
      log("initUI function not found");
    }

    // Initialize settings
    if (typeof initSettings === 'function') {
      log("Calling initSettings()");
      initSettings();
      log("initSettings() completed");
      if (window.debugSystem) {
        window.debugSystem.log.info('system', 'Settings initialized');
      }
    } else {
      log("initSettings function not found");
    }

    // Initialize video UI
    if (typeof initVideoUI === 'function') {
      log("Calling initVideoUI()");
      initVideoUI();
      log("initVideoUI() completed");
      if (window.debugSystem) {
        window.debugSystem.log.info('video', 'Video UI initialized');
      }
    } else {
      log("initVideoUI function not found");
    }

    // Load FFmpeg
    log("Calling initFFmpeg()");
    const ffmpegLoaded = await initFFmpeg();
    log("initFFmpeg() completed, result: " + ffmpegLoaded);

    // Load WASM
    if (typeof initWasm === 'function') {
      log("Calling initWasm()");
      const wasmLoaded = await initWasm();
      log("initWasm() completed, result: " + wasmLoaded);
    } else {
      log("initWasm function not found");
    }

    // Mark initialization as complete
    window.appInitialized = true;
    log("Application initialization complete");
    if (window.debugSystem) {
      window.debugSystem.log.info('system', 'Application initialization complete');
    }
  } catch (err) {
    log('Initialization error: ' + err.message);
    if (window.debugSystem) {
      window.debugSystem.log.error('system', 'Initialization error:', err);
    }
  }
}

// Add audio mixing function
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

    // Mix audio using WASM if available
    if (typeof mixAudioWithWasm === 'function') {
      const result = await mixAudioWithWasm(mainAudioData, bgAudioData, volume / 100, duration);
      updateUIWithResult(result);
    } else {
      log('mixAudioWithWasm function not available');
    }

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

// Helper function to read file as Data URL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to update UI with mix result
function updateUIWithResult(result) {
  const resultContainer = document.getElementById('resultContainer');
  const resultMediaContainer = document.getElementById('resultMediaContainer');
  const downloadLink = document.getElementById('downloadLink');

  if (resultContainer && resultMediaContainer && downloadLink) {
    // Clear previous results
    resultMediaContainer.innerHTML = '';

    // Create audio player for preview
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = URL.createObjectURL(result);
    resultMediaContainer.appendChild(audio);

    // Update download link
    downloadLink.href = audio.src;
    downloadLink.style.display = 'block';

    // Show result container
    resultContainer.style.display = 'block';
  }
}

// IMPORTANT: Export functions to global scope
window.init = init;
window.checkFilesLoaded = checkFilesLoaded;
window.initFFmpeg = initFFmpeg;
window.log = log;
window.mixAudio = mixAudio;
window.readFileAsDataURL = readFileAsDataURL;
window.updateUIWithResult = updateUIWithResult;

// Log that script.js has loaded and exported functions
console.log('script.js loaded and functions exported to global scope:', {
  init: typeof window.init === 'function',
  checkFilesLoaded: typeof window.checkFilesLoaded === 'function',
  log: typeof window.log === 'function',
  mixAudio: typeof window.mixAudio === 'function'
});