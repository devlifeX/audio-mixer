// Check for SharedArrayBuffer support
function checkSharedArrayBufferSupport() {
  if (window.debugSystem) {
    window.debugSystem.log.debug('system', 'Checking for SharedArrayBuffer support');
  }
  try {
    new SharedArrayBuffer(1);
    if (window.debugSystem) {
      window.debugSystem.log.info('system', 'SharedArrayBuffer is supported');
    }
    return true;
  } catch (e) {
    if (window.debugSystem) {
      window.debugSystem.log.warn('system', 'SharedArrayBuffer is not supported:', e.message);
    }
    return false;
  }
}

// Simple logging function that writes to console and UI
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

// Read file as ArrayBuffer
function readFileAsArrayBuffer(file) {
  if (window.debugSystem) {
    window.debugSystem.log.debug('file', `Reading file as ArrayBuffer: ${file.name}, size: ${file.size} bytes`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (window.debugSystem) {
        window.debugSystem.log.debug('file', `File read complete: ${file.name}`);
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      if (window.debugSystem) {
        window.debugSystem.log.error('file', `Error reading file: ${file.name}`, reader.error);
      }
      reject(reader.error);
    };
    reader.readAsArrayBuffer(file);
  });
}

// Read file as Data URL
function readFileAsDataURL(file) {
  if (window.debugSystem) {
    window.debugSystem.log.debug('file', `Reading file as Data URL: ${file.name}, size: ${file.size} bytes`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (window.debugSystem) {
        window.debugSystem.log.debug('file', `File read as Data URL complete: ${file.name}`);
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      if (window.debugSystem) {
        window.debugSystem.log.error('file', `Error reading file as Data URL: ${file.name}`, reader.error);
      }
      reject(reader.error);
    };
    reader.readAsDataURL(file);
  });
}

// Initialize FFmpeg (placeholder function - replace with actual implementation)
async function initFFmpeg() {
  if (window.debugSystem) {
    window.debugSystem.log.info('ffmpeg', 'Initializing FFmpeg');
  }

  try {
    // Placeholder for actual FFmpeg initialization
    console.log('FFmpeg initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing FFmpeg:', error);
    if (window.debugSystem) {
      window.debugSystem.log.error('ffmpeg', 'Error initializing FFmpeg:', error);
    }
    return false;
  }
}

// Main application initialization function
async function init() {
  console.log("init() function called");

  // Prevent multiple initializations
  if (window.appInitialized) {
    console.log("Application already initialized, skipping");
    return;
  }

  // First, ensure debug system is initialized
  if (window.debugSystem) {
    if (typeof window.debugSystem.init === 'function') {
      window.debugSystem.init();
      console.log("Debug system initialized from script.js");
    }
    window.debugSystem.log.info('system', 'Initializing application');
  } else {
    console.warn("Debug system not available");
  }

  try {
    // Check for SharedArrayBuffer support first
    const sabSupported = checkSharedArrayBufferSupport();
    if (!sabSupported) {
      const sabWarning = document.getElementById('sabWarning');
      if (sabWarning) {
        sabWarning.style.display = 'block';
      }
      console.warn('SharedArrayBuffer is not supported in this browser/context');
    }

    // Initialize UI
    if (typeof initUI === 'function') {
      console.log("Calling initUI()");
      initUI();
      console.log("initUI() completed");
      if (window.debugSystem) {
        window.debugSystem.log.info('ui', 'UI initialized');
      }
    } else {
      console.error("initUI function not found");
    }

    // Initialize settings
    if (typeof initSettings === 'function') {
      console.log("Calling initSettings()");
      initSettings();
      console.log("initSettings() completed");
      if (window.debugSystem) {
        window.debugSystem.log.info('system', 'Settings initialized');
      }
    } else {
      console.error("initSettings function not found");
    }

    // Initialize video UI
    if (typeof initVideoUI === 'function') {
      console.log("Calling initVideoUI()");
      initVideoUI();
      console.log("initVideoUI() completed");
      if (window.debugSystem) {
        window.debugSystem.log.info('video', 'Video UI initialized');
      }
    } else {
      console.error("initVideoUI function not found");
    }

    // Load FFmpeg
    console.log("Calling initFFmpeg()");
    const ffmpegLoaded = await initFFmpeg();
    console.log("initFFmpeg() completed, result:", ffmpegLoaded);
    if (!ffmpegLoaded) {
      console.error('Failed to load FFmpeg');
      if (window.debugSystem) {
        window.debugSystem.log.error('system', 'Failed to load FFmpeg');
      }
      throw new Error('Failed to load FFmpeg');
    }

    // Load WASM
    console.log("Calling initWasm()");
    const wasmLoaded = await initWasm();
    console.log("initWasm() completed, result:", wasmLoaded);
    if (!wasmLoaded) {
      console.error('Failed to load WASM');
      if (window.debugSystem) {
        window.debugSystem.log.error('system', 'Failed to load WASM');
      }
      throw new Error('Failed to load WASM');
    }

    // UI update utilities
    const updateUI = {
      progressBar: function (percent) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        if (progressBar) {
          progressBar.style.width = percent + '%';
        }

        if (progressText) {
          progressText.textContent = 'Processing: ' + percent + '%';
        }

        console.log(`Progress updated: ${percent}%`);
        if (window.debugSystem) {
          window.debugSystem.log.debug('ui', `Progress updated: ${percent}%`);
        }
      }
    };

    // Make sure this object is globally available
    window.updateUI = updateUI;

    // Basic mix audio function for testing
    async function mixAudio() {
      console.log("mixAudio function called");
      if (window.debugSystem) {
        window.debugSystem.log.info('system', 'Starting audio mixing process');
      }
      try {
        // Get the audio files
        const mainAudioFile = document.getElementById('mainAudio').files[0];
        const bgAudioFile = document.getElementById('bgAudio').files[0];

        if (!mainAudioFile && !bgAudioFile) {
          throw new Error("No audio files selected");
        }

        // Show progress
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
          progressContainer.style.display = 'block';
        }

        // For testing, just simulate progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          updateUI.progressBar(i);
          console.log(`Processing: ${i}%`);
        }

        // Simulate success
        log("Audio mixing completed successfully!");
        if (window.debugSystem) {
          window.debugSystem.log.info('system', 'Audio mixing completed successfully');
        }

        // Hide progress
        if (progressContainer) {
          progressContainer.style.display = 'none';
        }

        return true;
      } catch (error) {
        console.error("Error in mixAudio:", error);
        if (window.debugSystem) {
          window.debugSystem.log.error('system', 'Error in mixAudio:', error);
        }
        log("Error: " + error.message);
        throw error;
      }
    }
    // Make sure this function is globally available
    window.mixAudio = mixAudio;

    // Check if both files are loaded to enable the mix button
    function checkFilesLoaded() {
      console.log("checkFilesLoaded function called");

      const mainAudioInput = document.getElementById('mainAudio');
      const bgAudioInput = document.getElementById('bgAudio');
      const mixButton = document.getElementById('mixButton');

      if (!mainAudioInput || !bgAudioInput || !mixButton) {
        console.error("Required elements not found for checkFilesLoaded");
        return;
      }

      const mainAudioFile = mainAudioInput.files[0];
      const bgAudioFile = bgAudioInput.files[0];

      if (mainAudioFile || bgAudioFile) {
        mixButton.disabled = false;
        console.log("Mix button enabled - files loaded");
        if (window.debugSystem) {
          window.debugSystem.log.debug('ui', 'Mix button enabled - files loaded', {
            mainAudio: mainAudioFile ? mainAudioFile.name : 'none',
            bgAudio: bgAudioFile ? bgAudioFile.name : 'none'
          });
        }
      } else {
        mixButton.disabled = true;
        console.log("Mix button disabled - no files loaded");
        if (window.debugSystem) {
          window.debugSystem.log.debug('ui', 'Mix button disabled - no files loaded');
        }
      }
    }

    // Make sure this function is globally available
    window.checkFilesLoaded = checkFilesLoaded;

    // Mark initialization as complete
    window.appInitialized = true;
    console.log("Application initialization complete");
    if (window.debugSystem) {
      window.debugSystem.log.info('system', 'Application initialization complete');
    }
  } catch (err) {
    console.error('Initialization error:', err);
    log('Initialization error: ' + err.message);
    if (window.debugSystem) {
      window.debugSystem.log.error('system', 'Initialization error:', err);
    }
  }
}

// Export functions to global scope
window.init = init;
window.checkSharedArrayBufferSupport = checkSharedArrayBufferSupport;
window.log = log;
window.readFileAsArrayBuffer = readFileAsArrayBuffer;
window.readFileAsDataURL = readFileAsDataURL;
window.initFFmpeg = initFFmpeg;