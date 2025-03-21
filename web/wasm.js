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

// Modified mixAudioWithWasm function to use browser-based audio processing
async function mixAudioWithWasm(mainAudioData, bgAudioData, volume, duration) {
  if (window.debugSystem) {
    window.debugSystem.log.info('wasm', 'Calling audio mixing function', {
      mainAudioLength: mainAudioData ? mainAudioData.substring(0, 50) + '...' : 'null',
      bgAudioLength: bgAudioData ? bgAudioData.substring(0, 50) + '...' : 'null',
      volume,
      duration
    });
  }

  try {
    // Check if we should use the WASM implementation or fallback to browser implementation
    if (typeof window.mixAudio === 'function' && !window.forceJSAudioProcessing) {
      // Try WASM implementation first
      try {
        return await window.mixAudio(mainAudioData, bgAudioData, volume, duration);
      } catch (wasmError) {
        // If WASM fails with filesystem error, fallback to JS implementation
        if (wasmError.message && wasmError.message.includes('not implemented on js')) {
          console.warn('WASM filesystem operations not supported, falling back to JS implementation');
          window.forceJSAudioProcessing = true; // Remember to use JS implementation for future calls
        } else {
          throw wasmError; // Re-throw other errors
        }
      }
    }

    // Use browser-based audio processing as fallback
    if (window.debugSystem) {
      window.debugSystem.log.info('audio', 'Using browser-based audio processing');
    }

    // Make sure audio processor is available
    if (!window.audioProcessor || !window.audioProcessor.processAudioMixing) {
      throw new Error('Browser audio processor not available. Make sure audio-processor.js is loaded.');
    }

    // Process audio using browser APIs
    return await window.audioProcessor.processAudioMixing(mainAudioData, bgAudioData, volume, duration);
  } catch (err) {
    if (window.debugSystem) {
      window.debugSystem.log.error('wasm', 'Error mixing audio:', err);
    }
    console.error('Error mixing audio:', err);
    throw err;
  }
}

async function createVideoWithWasm(audioData, imageDataArray, settings) {
  if (window.debugSystem) {
    window.debugSystem.log.info('wasm', 'Calling createVideo WASM function', {
      audioDataLength: audioData ? audioData.length : 0,
      imageDataArrayLength: imageDataArray ? imageDataArray.length : 0,
      settings,
    });
  }

  try {
    // Check if we should use the WASM implementation or fallback to browser implementation
    if (typeof window.createVideo === 'function' && !window.forceJSVideoProcessing) {
      // Try WASM implementation first
      try {
        return await window.createVideo(audioData, imageDataArray, settings);
      } catch (wasmError) {
        // If WASM fails with filesystem error, fallback to JS implementation
        if (wasmError.message && wasmError.message.includes('not implemented on js')) {
          console.warn('WASM filesystem operations not supported, falling back to JS implementation for video creation');
          window.forceJSVideoProcessing = true; // Remember to use JS implementation for future calls
        } else {
          throw wasmError; // Re-throw other errors
        }
      }
    }

    // Use browser-based video processing as fallback
    if (window.debugSystem) {
      window.debugSystem.log.info('video', 'Using browser-based video processing');
    }

    // Make sure video processor is available
    if (!window.videoProcessor || !window.videoProcessor.createVideoFromImagesAndAudio) {
      throw new Error('Browser video processor not available. Make sure video-processor.js is loaded.');
    }

    // Process video using browser APIs
    return await window.videoProcessor.createVideoFromImagesAndAudio(imageDataArray, audioData, settings);
  } catch (err) {
    if (window.debugSystem) {
      window.debugSystem.log.error('wasm', 'Error creating video:', err);
    }
    console.error('Error creating video:', err);
    throw err;
  }
}

// Make functions globally available
window.initWasm = initWasm;
window.mixAudioWithWasm = mixAudioWithWasm;
window.createVideoWithWasm = createVideoWithWasm;