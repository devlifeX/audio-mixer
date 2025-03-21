// UI functions module

let logsElement;

// Initialize UI elements and references
function initUI() {
  logsElement = document.getElementById('logs');

  // Any other UI initialization can go here
  return true;
}

// Log function
function log(message) {
  console.log(message);
  if (logsElement) {
    logsElement.innerHTML += `${message}<br>`;
    logsElement.scrollTop = logsElement.scrollHeight;
  }
}

// UI update functions
const updateUI = {
  // Update progress bar
  progressBar: (percent) => {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (progressBar && progressText) {
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `Processing: ${percent}%`;
    }
  },

  // Show progress container
  showProgress: () => {
    const progressContainer = document.querySelector('.progress-container');
    const resultContainer = document.getElementById('resultContainer');

    if (progressContainer) progressContainer.style.display = 'block';
    if (resultContainer) resultContainer.style.display = 'none';
  },

  // Show result container with audio
  // Updated to accept the new filename pattern
  showResult: (url, format, outputBaseName) => {
    const resultContainer = document.getElementById('resultContainer');
    const resultAudio = document.getElementById('resultAudio');
    const downloadLink = document.getElementById('downloadLink');

    if (resultAudio) resultAudio.src = url;

    if (downloadLink) {
      downloadLink.href = url;
      // Use the new filename pattern for the download
      const downloadFilename = outputBaseName ? `${outputBaseName}.${format}` : `mixed_audio.${format}`;
      downloadLink.download = downloadFilename;
      downloadLink.textContent = `Download ${format.toUpperCase()}`;
    }

    if (resultContainer) resultContainer.style.display = 'block';
  }
};

export { initUI, updateUI, log };