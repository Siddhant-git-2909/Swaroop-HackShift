export function getSupportedRecordingMimeType(): string {
  if (typeof MediaRecorder === 'undefined') {
    return 'audio/wav';
  }

  const preferredTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];

  const supported = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
  return supported || 'audio/webm';
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const dataLength = audioBuffer.length * channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  const channelData = Array.from({ length: channels }, (_, index) => audioBuffer.getChannelData(index));

  for (let sampleIndex = 0; sampleIndex < audioBuffer.length; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
      const sampleValue = Math.max(-1, Math.min(1, channelData[channelIndex][sampleIndex]));
      const intSample = sampleValue < 0 ? sampleValue * 0x8000 : sampleValue * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return buffer;
}

export async function normalizeAudioBlobForUpload(audioBlob: Blob): Promise<Blob> {
  if (!audioBlob || audioBlob.size === 0) {
    return audioBlob;
  }

  if (audioBlob.type.includes('wav') || audioBlob.type.includes('pcm')) {
    return audioBlob;
  }

  const AudioContextCtor = (window as any)?.AudioContext || (window as any)?.webkitAudioContext;
  if (!AudioContextCtor) {
    return audioBlob;
  }

  try {
    const audioContext = new AudioContextCtor();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const wavBytes = encodeWav(decoded);
    await audioContext.close();
    return new Blob([wavBytes], { type: 'audio/wav' });
  } catch (error) {
    console.warn('[voice-debug] Audio conversion fallback failed, keeping original blob:', error);
    return audioBlob;
  }
}
