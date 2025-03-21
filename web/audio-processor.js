// Audio processing functions for browser environment

// Initialize the audio context
let audioContext;

// Initialize audio context on first user interaction
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log("AudioContext initialized");
  }
  return audioContext;
}

// Mix two audio buffers with specified volume for the second buffer
async function mixAudioBuffers(buffer1, buffer2, volume = 0.5) {
  const ctx = initAudioContext();

  // Get the longest duration
  const length = Math.max(buffer1.length, buffer2.length);
  const sampleRate = ctx.sampleRate;

  // Create a new buffer for the mixed result
  const result = ctx.createBuffer(
    Math.max(buffer1.numberOfChannels, buffer2.numberOfChannels),
    length,
    sampleRate
  );

  // Mix the channels
  for (let channel = 0; channel < result.numberOfChannels; channel++) {
    const resultData = result.getChannelData(channel);

    // Get channel data from both buffers or use silence
    const buffer1Data = channel < buffer1.numberOfChannels ?
      buffer1.getChannelData(channel) : new Float32Array(length).fill(0);

    const buffer2Data = channel < buffer2.numberOfChannels ?
      buffer2.getChannelData(channel) : new Float32Array(length).fill(0);

    // Mix the samples
    for (let i = 0; i < length; i++) {
      const sample1 = i < buffer1Data.length ? buffer1Data[i] : 0;
      const sample2 = i < buffer2Data.length ? buffer2Data[i] * volume : 0;

      // Simple mixing (could be improved with more sophisticated algorithms)
      resultData[i] = Math.max(-1, Math.min(1, sample1 + sample2));
    }
  }

  return result;
}

// Convert ArrayBuffer to AudioBuffer
async function arrayBufferToAudioBuffer(arrayBuffer) {
  const ctx = initAudioContext();
  return await ctx.decodeAudioData(arrayBuffer);
}

// Convert AudioBuffer to WAV format ArrayBuffer
function audioBufferToWav(buffer) {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;

  // Create the WAV file
  const wavDataView = createWavFile(buffer, numberOfChannels, sampleRate);

  return wavDataView.buffer;
}

// Create a WAV file from AudioBuffer
function createWavFile(audioBuffer, numChannels, sampleRate) {
  const bytesPerSample = 2; // 16-bit audio
  const blockAlign = numChannels * bytesPerSample;
  const buffer = audioBuffer;
  const length = buffer.length;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  // Create the buffer for the WAV file
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // Write the WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk1size (16 for PCM)
  view.setUint16(20, 1, true); // audio format (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true); // bits per sample

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write the PCM samples
  const offset = 44;
  let pos = 0;

  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];

      // Convert float to 16-bit signed integer
      const int16 = sample < 0 ? Math.max(-1, sample) * 0x8000 : Math.min(1, sample) * 0x7FFF;

      view.setInt16(offset + pos, int16, true);
      pos += 2;
    }
  }

  return view;
}

// Helper function to write a string to a DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Process audio mixing in the browser
async function processAudioMixing(mainAudioData, bgAudioData, volume, duration) {
  try {
    // Convert base64 data URLs to array buffers
    const mainArrayBuffer = await base64ToArrayBuffer(mainAudioData);
    const bgArrayBuffer = await base64ToArrayBuffer(bgAudioData);

    // Convert array buffers to audio buffers
    const mainAudioBuffer = await arrayBufferToAudioBuffer(mainArrayBuffer);
    const bgAudioBuffer = await arrayBufferToAudioBuffer(bgArrayBuffer);

    // Apply duration limit if specified
    let processedMainBuffer = mainAudioBuffer;
    if (duration > 0 && duration < mainAudioBuffer.duration) {
      processedMainBuffer = trimAudioBuffer(mainAudioBuffer, 0, duration);
    }

    // Mix the audio buffers
    const mixedBuffer = await mixAudioBuffers(processedMainBuffer, bgAudioBuffer, volume);

    // Convert the mixed buffer to WAV format
    const wavArrayBuffer = audioBufferToWav(mixedBuffer);

    // Return as MP3 if possible (requires external library)
    // For now, return as WAV
    return new Blob([wavArrayBuffer], { type: 'audio/wav' });
  } catch (error) {
    console.error('Error processing audio mix:', error);
    throw error;
  }
}

// Trim an audio buffer to a specific duration
function trimAudioBuffer(buffer, startTime, duration) {
  const sampleRate = buffer.sampleRate;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor((startTime + duration) * sampleRate);
  const length = endSample - startSample;

  const ctx = initAudioContext();
  const newBuffer = ctx.createBuffer(
    buffer.numberOfChannels,
    length,
    sampleRate
  );

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const newData = newBuffer.getChannelData(channel);
    const originalData = buffer.getChannelData(channel);

    for (let i = 0; i < length; i++) {
      newData[i] = originalData[i + startSample];
    }
  }

  return newBuffer;
}

// Convert base64 data URL to ArrayBuffer
async function base64ToArrayBuffer(dataUrl) {
  // Extract the base64 data
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

// Export functions to global scope
window.audioProcessor = {
  processAudioMixing,
  initAudioContext
};