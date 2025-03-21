// WASM functionality module

// Load WASM
async function initWasm() {
  const go = new Go();
  try {
    const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject);
    go.run(result.instance);
    console.log('WASM loaded successfully');
    return true;
  } catch (err) {
    console.error('Error loading WASM:', err);
    return false;
  }
}

// Call the WASM mixAudio function
async function mixAudioWithWasm(mainAudioData, bgAudioData, volume, duration) {
  try {
    // Check if the global mixAudio function from WASM is available
    if (typeof window.mixAudio !== 'function') {
      throw new Error('WASM mixAudio function not available. Make sure WASM is properly loaded.');
    }
    
    // Call the WASM function with the provided parameters
    return await window.mixAudio(mainAudioData, bgAudioData, volume, duration);
  } catch (err) {
    console.error('Error calling WASM mixAudio function:', err);
    throw err;
  }
}

export { initWasm, mixAudioWithWasm };