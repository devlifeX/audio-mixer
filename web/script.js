// Initialize variables
let mainAudioFile = null;
let bgAudioFile = null;
let ffmpeg = null;

// DOM elements
const mainAudioInput = document.getElementById('mainAudio');
const bgAudioInput = document.getElementById('bgAudio');
const mainAudioPlayer = document.getElementById('mainAudioPlayer');
const bgAudioPlayer = document.getElementById('bgAudioPlayer');
const volumeControl = document.getElementById('volumeControl');
const volumeValue = document.getElementById('volumeValue');
const mixButton = document.getElementById('mixButton');
const progressContainer = document.querySelector('.progress-container');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultContainer = document.getElementById('resultContainer');
const resultAudio = document.getElementById('resultAudio');
const downloadLink = document.getElementById('downloadLink');
const logsElement = document.getElementById('logs');
const sabWarning = document.getElementById('sabWarning');

// Settings elements
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const outputFormat = document.getElementById('outputFormat');
const outputQuality = document.getElementById('outputQuality');
const normalizeAudio = document.getElementById('normalizeAudio');

// Settings management
function initSettings() {
  // Load settings panel state from localStorage
  const isPanelHidden = localStorage.getItem('settingsPanelHidden') === 'true';

  // Apply initial state
  if (isPanelHidden) {
    settingsPanel.classList.add('hidden');
  } else {
    settingsPanel.classList.remove('hidden');
  }

  // Toggle settings panel visibility
  settingsToggle.addEventListener('click', () => {
    const isHidden = settingsPanel.classList.toggle('hidden');
    localStorage.setItem('settingsPanelHidden', isHidden);
  });

  // Load saved settings values if they exist
  if (localStorage.getItem('outputFormat')) {
    outputFormat.value = localStorage.getItem('outputFormat');
  }

  if (localStorage.getItem('outputQuality')) {
    outputQuality.value = localStorage.getItem('outputQuality');
  }

  if (localStorage.getItem('normalizeAudio') !== null) {
    normalizeAudio.checked = localStorage.getItem('normalizeAudio') === 'true';
  }

  // Save settings when changed
  outputFormat.addEventListener('change', () => {
    localStorage.setItem('outputFormat', outputFormat.value);
    updateDownloadLinkExtension();
  });

  outputQuality.addEventListener('change', () => {
    localStorage.setItem('outputQuality', outputQuality.value);
  });

  normalizeAudio.addEventListener('change', () => {
    localStorage.setItem('normalizeAudio', normalizeAudio.checked);
  });
}

// Update download link extension based on selected format
function updateDownloadLinkExtension() {
  const format = outputFormat.value;
  if (downloadLink.download) {
    downloadLink.download = `mixed_audio.${format}`;
  }
}

// Check for SharedArrayBuffer support
function checkSharedArrayBufferSupport() {
  try {
    // Try to create a SharedArrayBuffer
    new SharedArrayBuffer(1);
    return true;
  } catch (e) {
    return false;
  }
}

// Load WASM
async function initWasm() {
  const go = new Go();
  try {
    const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject);
    go.run(result.instance);
    log('WASM loaded successfully');
    return true;
  } catch (err) {
    log('Error loading WASM: ' + err);
    console.error(err);
    return false;
  }
}

// Initialize ffmpeg
async function initFFmpeg() {
  try {
    // Check for SharedArrayBuffer support
    if (!checkSharedArrayBufferSupport()) {
      sabWarning.style.display = 'block';
      log('Error: SharedArrayBuffer is not supported in your browser or context.');
      log('Make sure you are using HTTPS or localhost, and have the appropriate headers set.');
      return false;
    }

    // Check if FFmpeg is available
    if (typeof FFmpeg === 'undefined') {
      log('Error: FFmpeg library not found. Make sure it is properly loaded in the HTML.');
      return false;
    }

    log('Creating FFmpeg instance...');
    // Create FFmpeg instance
    const { createFFmpeg } = FFmpeg;
    ffmpeg = createFFmpeg({
      log: true,
      logger: ({ type, message }) => {
        if (type === 'fferr') {
          log(`FFmpeg: ${message}`);
        }
      },
      progress: ({ ratio }) => {
        const percent = Math.floor(ratio * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `Processing: ${percent}%`;
      },
      corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
    });

    log('Loading FFmpeg WASM...');
    await ffmpeg.load();
    log('FFmpeg loaded successfully');
    return true;
  } catch (err) {
    log('Error loading FFmpeg: ' + err);
    console.error(err);
    return false;
  }
}

// Log function
function log(message) {
  console.log(message);
  logsElement.innerHTML += `${message}<br>`;
  logsElement.scrollTop = logsElement.scrollHeight;
}

// File input handlers
mainAudioInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    mainAudioFile = e.target.files[0];
    mainAudioPlayer.src = URL.createObjectURL(mainAudioFile);
    mainAudioPlayer.style.display = 'block';
    checkFilesLoaded();
    log(`Main audio loaded: ${mainAudioFile.name}`);
  }
});

bgAudioInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    bgAudioFile = e.target.files[0];
    bgAudioPlayer.src = URL.createObjectURL(bgAudioFile);
    bgAudioPlayer.style.display = 'block';
    checkFilesLoaded();
    log(`Background audio loaded: ${bgAudioFile.name}`);
  }
});

// Volume control
volumeControl.addEventListener('input', () => {
  volumeValue.textContent = volumeControl.value;
});

// Check if both files are loaded to enable the mix button
function checkFilesLoaded() {
  mixButton.disabled = !(mainAudioFile && bgAudioFile && ffmpeg && ffmpeg.isLoaded());
}

// Mix audio files
mixButton.addEventListener('click', async () => {
  if (!mainAudioFile || !bgAudioFile) {
    log('Please select both audio files');
    return;
  }

  try {
    mixButton.disabled = true;
    progressContainer.style.display = 'block';
    resultContainer.style.display = 'none';

    log('Starting audio mixing process...');

    // Read files as data URLs
    const mainAudioData = await readFileAsDataURL(mainAudioFile);
    const bgAudioData = await readFileAsDataURL(bgAudioFile);

    // Call WASM function to get the ffmpeg command and format info
    log('Processing file information with WASM...');
    const result = await mixAudio(mainAudioData, bgAudioData, parseFloat(volumeControl.value));

    // Read files as array buffers
    const mainFileData = await readFileAsArrayBuffer(mainAudioFile);
    const bgFileData = await readFileAsArrayBuffer(bgAudioFile);

    // Get file extensions
    const mainExt = result.mainAudioFormat;
    const bgExt = result.bgAudioFormat;

    // Get selected output format from settings
    const format = outputFormat.value;
    const quality = outputQuality.value;
    const normalize = normalizeAudio.checked;

    // Write files to ffmpeg virtual filesystem
    log('Writing files to FFmpeg virtual filesystem...');
    ffmpeg.FS('writeFile', `main.${mainExt}`, new Uint8Array(mainFileData));
    ffmpeg.FS('writeFile', `bg.${bgExt}`, new Uint8Array(bgFileData));

    // List files in the virtual filesystem to verify they were written correctly
    log('Files in virtual filesystem:');
    const files = ffmpeg.FS('readdir', '/');
    log(files.join(', '));

    // Manually construct the command array to ensure proper handling of complex filters
    let commandArray = [];

    // Input files
    commandArray.push('-i', `main.${mainExt}`, '-i', `bg.${bgExt}`);

    // Filter complex with normalization if enabled
    let filterComplex = `[1:a]volume=${volumeControl.value}[bg];`;

    if (normalize) {
      filterComplex += `[0:a]dynaudnorm[a0norm];[bg]dynaudnorm[bgnorm];[a0norm][bgnorm]`;
    } else {
      filterComplex += `[0:a][bg]`;
    }

    filterComplex += `amix=inputs=2:duration=longest:dropout_transition=2`;

    commandArray.push('-filter_complex', filterComplex);

    // Output options based on format
    const outputFilename = `output.${format}`;

    if (format === 'mp3') {
      commandArray.push('-c:a', 'libmp3lame', '-q:a', quality);
    } else if (format === 'ogg') {
      commandArray.push('-c:a', 'libvorbis', '-q:a', quality);
    } else if (format === 'wav') {
      commandArray.push('-c:a', 'pcm_s16le');
    }

    commandArray.push(outputFilename);

    log('Executing FFmpeg command with arguments: ' + commandArray.join(' '));

    // Execute the command
    await ffmpeg.run(...commandArray);

    // List files again to see if output was created
    log('Files after processing:');
    const filesAfter = ffmpeg.FS('readdir', '/');
    log(filesAfter.join(', '));

    // Check if output file exists
    if (!filesAfter.includes(outputFilename)) {
      throw new Error('Output file was not created. FFmpeg command may have failed.');
    }

    // Read the result
    log('Processing complete, reading output file...');
    const data = ffmpeg.FS('readFile', outputFilename);

    // Create a blob and URL
    const mimeTypes = {
      'mp3': 'audio/mp3',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg'
    };

    const blob = new Blob([data.buffer], { type: mimeTypes[format] || 'audio/mp3' });
    const url = URL.createObjectURL(blob);

    // Update UI with the result
    resultAudio.src = url;
    downloadLink.href = url;
    downloadLink.download = `mixed_audio.${format}`;
    resultContainer.style.display = 'block';

    log('Audio mixing completed successfully!');
  } catch (err) {
    log('Error during mixing: ' + err);
    console.error(err);
  } finally {
    mixButton.disabled = false;
  }
});

// Helper functions
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Initialize
async function init() {
  // Initialize settings first
  initSettings();

  const wasmLoaded = await initWasm();
  const ffmpegLoaded = await initFFmpeg();

  if (wasmLoaded && ffmpegLoaded) {
    log('All components loaded successfully. Ready to mix audio!');
  } else {
    log('Some components failed to load. Please check the console for errors.');
  }

  checkFilesLoaded();
}

// Start initialization when the page loads
init();