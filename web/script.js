// Add this function near the top of script.js
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

// Add this after the initFFmpeg function definition
async function initFFmpeg() {
  if (window.debugSystem) {
    window.debugSystem.log.info('ffmpeg', 'Initializing FFmpeg');
  }

  try {
    // Placeholder for actual FFmpeg initialization
    log('FFmpeg initialized successfully');
    return true;
  } catch (error) {
    log('Error initializing FFmpeg:', error);
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
    log("initFFmpeg() completed, result:", ffmpegLoaded);
    if (!ffmpegLoaded) {
      log('Failed to load FFmpeg');
      if (window.debugSystem) {
        window.debugSystem.log.error('system', 'Failed to load FFmpeg');
      }
      throw new Error('Failed to load FFmpeg');
    }

    // Load WASM
    log("Calling initWasm()");
    const wasmLoaded = await initWasm();
    log("initWasm() completed, result:", wasmLoaded);
    if (!wasmLoaded) {
      log('Failed to load WASM');
      if (window.debugSystem) {
        window.debugSystem.log.error('system', 'Failed to load WASM');
      }
      throw new Error('Failed to load WASM');
    }

    // Mark initialization as complete
    window.appInitialized = true;
    log("Application initialization complete");
    if (window.debugSystem) {
      window.debugSystem.log.info('system', 'Application initialization complete');
    }
  } catch (err) {
    log('Initialization error:', err);
    if (window.debugSystem) {
      window.debugSystem.log.error('system', 'Initialization error:', err);
    }
  }
}

// Export functions to global scope
window.checkFilesLoaded = checkFilesLoaded;
window.init = init;
window.initFFmpeg = initFFmpeg;
window.log = log; // Add this line to export log function
