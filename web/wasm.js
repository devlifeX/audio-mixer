// WASM functionality module

// Load WASM
async function initWasm() {
  if (window.debugSystem) {
    window.debugSystem.log.info('wasm', 'Initializing WebAssembly');
  }

  const go = new Go();
  try {
    if (window.debugSystem) {
      window.debugSystem.log.debug('wasm', 'Fetching main.wasm with cache busting');
    }

    const result = await WebAssembly.instantiateStreaming(fetch('main.wasm?v=' + new Date().getTime()), go.importObject);

    if (window.debugSystem) {
      window.debugSystem.log.debug('wasm', 'WebAssembly instantiated, starting Go runtime');
    }

    go.run(result.instance);

    // Check if the expected functions are available
    if (window.debugSystem) {
      window.debugSystem.log.debug('wasm', 'Checking for exported WASM functions', {
        mixAudio: typeof window.mixAudio === 'function',
        createVideo: typeof window.createVideo === 'function'
      });
    }

    console.log('WASM loaded successfully');
    return true;
  } catch (err) {
    if (window.debugSystem) {
      window.debugSystem.log.error('wasm', 'Error loading WASM:', err);
    }
    console.error('Error loading WASM:', err);
    return false;
  }
}

// Call the WASM mixAudio function
async function mixAudioWithWasm(mainAudioData, bgAudioData, volume, duration) {
  if (window.debugSystem) {
    window.debugSystem.log.info('wasm', 'Calling mixAudio WASM function', {
      mainAudioLength: mainAudioData ? mainAudioData.substring(0, 50) + '...' : 'null',
      bgAudioLength: bgAudioData ? bgAudioData.substring(0, 50) + '...' : 'null',
      volume,
      duration
    });
  }

  try {
    // Check if the global mixAudio function from WASM is available
    if (typeof window.mixAudio !== 'function') {
      const error = 'WASM mixAudio function not available. Make sure WASM is properly loaded.';
      if (window.debugSystem) {
        window.debugSystem.log.error('wasm', error);
      }
      throw new Error(error);
    }

    // Check if we have the right number of arguments (now 4 with duration)
    if (arguments.length < 3 || arguments.length > 4) {
      const error = 'Expected 3-4 arguments: mainAudioData, bgAudioData, volume, and optional duration';
      if (window.debugSystem) {
        window.debugSystem.log.error('wasm', error);
      }
      throw new Error(error);
    }

    // Call the WASM function with the provided parameters
    const result = await window.mixAudio(mainAudioData, bgAudioData, volume, duration);

    if (window.debugSystem) {
      window.debugSystem.log.info('wasm', 'mixAudio WASM function returned result', result);
    }

    return result;
  } catch (err) {
    if (window.debugSystem) {
      window.debugSystem.log.error('wasm', 'Error calling WASM mixAudio function:', err);
    }
    console.error('Error calling WASM mixAudio function:', err);
    throw err;
  }
}

async function createVideoWithWasm(audioData, imageDataArray, settings) {
  if (window.debugSystem) {
    window.debugSystem.log.info('wasm', 'Calling createVideo WASM function', {
      audioDataLength: audioData ? audioData.byteLength : 0,
      imageDataArrayLength: imageDataArray ? imageDataArray.length : 0,
      settings,
    });
  }

  try {
    if (typeof window.createVideo !== 'function') {
      const error = 'WASM createVideo function not available. Make sure WASM is properly loaded.';
      if (window.debugSystem) {
        window.debugSystem.log.error('wasm', error);
      }
      throw new Error(error);
    }

    // Call the WASM function
    const videoArrayBuffer = await window.createVideo(audioData, imageDataArray, settings);

    if (window.debugSystem) {
      window.debugSystem.log.info('wasm', 'createVideo WASM function returned result');
    }

    // Convert ArrayBuffer to Blob
    const videoBlob = new Blob([videoArrayBuffer], { type: `video/${settings.videoFormat}` });
    return videoBlob;
  } catch (err) {
    if (window.debugSystem) {
      window.debugSystem.log.error('wasm', 'Error calling WASM createVideo function:', err);
    }
    console.error('Error calling WASM createVideo function:', err);
    throw err;
  }
}

// Make functions globally available
window.initWasm = initWasm;
window.mixAudioWithWasm = mixAudioWithWasm;
window.createVideoWithWasm = createVideoWithWasm;