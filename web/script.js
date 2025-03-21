// Main script file - handles initialization and orchestration

// Import our modules
import { initWasm, mixAudioWithWasm } from './wasm.js';
import { initUI, updateUI, log } from './ui.js';
import { initSettings, getSettings } from './settings.js';

// Initialize variables
let mainAudioFile = null;
let bgAudioFile = null;
let ffmpeg = null;
let mainAudioDuration = 0;
let bgAudioDuration = 0;

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

// Initialize ffmpeg
async function initFFmpeg() {
  try {
    // Check for SharedArrayBuffer support
    if (!checkSharedArrayBufferSupport()) {
      document.getElementById('sabWarning').style.display = 'block';
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
        updateUI.progressBar(percent);
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
// Get audio duration
function getAudioDuration(audioElement) {
  return new Promise((resolve) => {
    if (audioElement.readyState > 0) {
      resolve(audioElement.duration);
    } else {
      audioElement.addEventListener('loadedmetadata', () => {
        resolve(audioElement.duration);
      });
    }
  });
}

// Format duration in MM:SS format
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Check if both files are loaded to enable the mix button
function checkFilesLoaded() {
  const mixButton = document.getElementById('mixButton');
  mixButton.disabled = !(mainAudioFile && bgAudioFile && ffmpeg && ffmpeg.isLoaded());
}

// Get the desired output duration based on settings
function getOutputDuration() {
  const settings = getSettings();
  switch (settings.outputDuration) {
    case 'shortest':
      return Math.min(mainAudioDuration, bgAudioDuration);
    case 'longest':
      return Math.max(mainAudioDuration, bgAudioDuration);
    case 'main':
      return mainAudioDuration;
    case 'bg':
      return bgAudioDuration;
    case 'custom':
      return parseFloat(settings.customDurationValue);
    default:
      return Math.max(mainAudioDuration, bgAudioDuration); // Default to longest
  }
}

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

// Mix audio files
async function mixAudio() {
  if (!mainAudioFile || !bgAudioFile) {
    log('Please select both audio files');
    return;
  }

  try {
    const mixButton = document.getElementById('mixButton');
    mixButton.disabled = true;
    updateUI.showProgress();

    log('Starting audio mixing process...');

    // Read files as data URLs
    const mainAudioData = await readFileAsDataURL(mainAudioFile);
    const bgAudioData = await readFileAsDataURL(bgAudioFile);

    // Get the desired output duration
    const duration = getOutputDuration();
    log(`Output duration set to: ${formatDuration(duration)} seconds`);

    // Get volume from UI
    const volumeControl = document.getElementById('volumeControl');
    const volume = parseFloat(volumeControl.value);

    // Call WASM function to get the ffmpeg command and format info
    log('Processing file information with WASM...');
    const result = await mixAudioWithWasm(mainAudioData, bgAudioData, volume, duration);

    // Read files as array buffers
    const mainFileData = await readFileAsArrayBuffer(mainAudioFile);
    const bgFileData = await readFileAsArrayBuffer(bgAudioFile);

    // Get file extensions
    const mainExt = result.mainAudioFormat;
    const bgExt = result.bgAudioFormat;

    // Get selected output format from settings
    const settings = getSettings();
    const format = settings.outputFormat;
    const quality = settings.outputQuality;
    const normalize = settings.normalizeAudio;

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

    // Add duration parameter if needed
    if (settings.outputDuration !== 'longest') {
      commandArray.push('-t', duration.toString());
    }

    // Filter complex with normalization if enabled
    let filterComplex = `[1:a]volume=${volume}[bg];`;

    if (normalize) {
      filterComplex += `[0:a]dynaudnorm[a0norm];[bg]dynaudnorm[bgnorm];[a0norm][bgnorm]`;
    } else {
      filterComplex += `[0:a][bg]`;
    }

    // Use the duration mode from the settings
    let durationMode = "longest";
    switch (settings.outputDuration) {
      case 'shortest':
        durationMode = "shortest";
        break;
      case 'main':
      case 'bg':
      case 'custom':
        // For these modes, we use the -t parameter instead
        durationMode = "longest";
        break;
      default:
        durationMode = "longest";
    }

    filterComplex += `amix=inputs=2:duration=${durationMode}:dropout_transition=2`;

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
    updateUI.showResult(url, format);

    log('Audio mixing completed successfully!');
  } catch (err) {
    log('Error during mixing: ' + err);
    console.error(err);
  } finally {
    document.getElementById('mixButton').disabled = false;
  }
}

// Set up file input handlers
function setupFileInputs() {
  const mainAudioInput = document.getElementById('mainAudio');
  const bgAudioInput = document.getElementById('bgAudio');
  const mainAudioPlayer = document.getElementById('mainAudioPlayer');
  const bgAudioPlayer = document.getElementById('bgAudioPlayer');

  mainAudioInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      mainAudioFile = e.target.files[0];
      mainAudioPlayer.src = URL.createObjectURL(mainAudioFile);
      mainAudioPlayer.style.display = 'block';

      // Get the duration of the main audio
      mainAudioDuration = await getAudioDuration(mainAudioPlayer);
      log(`Main audio loaded: ${mainAudioFile.name} (${formatDuration(mainAudioDuration)})`);

      checkFilesLoaded();
    }
  });

  bgAudioInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      bgAudioFile = e.target.files[0];
      bgAudioPlayer.src = URL.createObjectURL(bgAudioFile);
      bgAudioPlayer.style.display = 'block';

      // Get the duration of the background audio
      bgAudioDuration = await getAudioDuration(bgAudioPlayer);
      log(`Background audio loaded: ${bgAudioFile.name} (${formatDuration(bgAudioDuration)})`);

      checkFilesLoaded();
    }
  });

  // Volume control
  const volumeControl = document.getElementById('volumeControl');
  const volumeValue = document.getElementById('volumeValue');
  volumeControl.addEventListener('input', () => {
    volumeValue.textContent = volumeControl.value;
  });

  // Mix button
  const mixButton = document.getElementById('mixButton');
  mixButton.addEventListener('click', mixAudio);
}

// Initialize
async function init() {
  // Initialize UI and settings first
  initUI();
  initSettings();
  setupFileInputs();

  // Initialize WASM and FFmpeg
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
document.addEventListener('DOMContentLoaded', init);

// Export functions that might be needed by other modules
export { log, formatDuration };
