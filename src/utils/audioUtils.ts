export type SoundType = 'meditation-bell' | 'soft-piano' | 'nature-chime';

export const isValidSoundType = (value: any): value is SoundType => {
  return ['meditation-bell', 'soft-piano', 'nature-chime'].includes(value);
};

export interface AudioSettings {
  enabled: boolean;
  volume: number;
  soundType: SoundType;
}

export const defaultAudioSettings: AudioSettings = {
  enabled: true,
  volume: 0.7,
  soundType: 'meditation-bell'
};

export const generateMeditationBell = (
  frequency: number = 432,
  duration: number = 1500,
  volume: number = 0.6
): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new AudioContext();
      const sampleRate = audioContext.sampleRate;
      const frameCount = (duration / 1000) * sampleRate;
      const audioBuffer = audioContext.createBuffer(2, frameCount, sampleRate);

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);

        for (let i = 0; i < frameCount; i++) {
          const time = i / sampleRate;

          // Very gentle attack (0.2s) and natural decay
          const attack = Math.min(time * 5, 1);
          const decay = Math.exp(-time * 2);
          const envelope = attack * decay;

          // Multiple harmonics for rich bell tone
          const fundamental = Math.sin(2 * Math.PI * frequency * time);
          const second = Math.sin(2 * Math.PI * frequency * 1.414 * time) * 0.4;
          const third = Math.sin(2 * Math.PI * frequency * 2.828 * time) * 0.2;

          // Add slight detuning for stereo width
          const detune = channel === 0 ? 1 : 1.003;

          channelData[i] = (fundamental + second + third) * volume * envelope * detune;
        }
      }

      resolve(audioBuffer);
    } catch (error) {
      reject(error);
    }
  });
};

export const generateSoftPiano = (
  frequency: number = 523.25,
  duration: number = 1800,
  volume: number = 0.5
): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new AudioContext();
      const sampleRate = audioContext.sampleRate;
      const frameCount = (duration / 1000) * sampleRate;
      const audioBuffer = audioContext.createBuffer(2, frameCount, sampleRate);

      // Create convolution for simple reverb
      const impulseLength = Math.floor(sampleRate * 0.8);
      const impulse = audioContext.createBuffer(2, impulseLength, sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const impulseData = impulse.getChannelData(channel);
        for (let i = 0; i < impulseLength; i++) {
          impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2) * 0.1;
        }
      }

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);

        for (let i = 0; i < frameCount; i++) {
          const time = i / sampleRate;

          // Piano-like envelope: quick attack, sustained, gradual release
          const attack = Math.min(time * 20, 1);
          const decay = time < 0.1 ? 1 : Math.exp(-(time - 0.1) * 0.8);
          const envelope = attack * decay;

          // Piano harmonics with warm overtones
          const fundamental = Math.sin(2 * Math.PI * frequency * time);
          const octave = Math.sin(2 * Math.PI * frequency * 2 * time) * 0.3;
          const fifth = Math.sin(2 * Math.PI * frequency * 1.5 * time) * 0.2;
          const third = Math.sin(2 * Math.PI * frequency * 1.25 * time) * 0.15;

          // Slight detune for warmth
          const detune = channel === 0 ? 1 : 1.002;

          channelData[i] = (fundamental + octave + fifth + third) * volume * envelope * detune;
        }
      }

      resolve(audioBuffer);
    } catch (error) {
      reject(error);
    }
  });
};

export const generateNatureChime = (
  baseFreq: number = 440,
  duration: number = 1200,
  volume: number = 0.55
): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new AudioContext();
      const sampleRate = audioContext.sampleRate;
      const frameCount = (duration / 1000) * sampleRate;
      const audioBuffer = audioContext.createBuffer(2, frameCount, sampleRate);

      // Wind chime frequencies (pentatonic scale)
      const chimeFreqs = [
        baseFreq * 1.0,     // Root
        baseFreq * 1.125,   // Minor second
        baseFreq * 1.25,    // Major second
        baseFreq * 1.5,     // Perfect fifth
        baseFreq * 1.875    // Major seventh
      ];

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);

        for (let i = 0; i < frameCount; i++) {
          const time = i / sampleRate;

          // Water drop / wind chime envelope
          const attack = Math.min(time * 10, 1);
          const decay = Math.exp(-time * 3);
          const envelope = attack * decay;

          let sample = 0;

          // Multiple chimes with different delays and amplitudes
          chimeFreqs.forEach((freq, index) => {
            const delay = index * 0.05; // Slight delay between chimes
            const adjustedTime = Math.max(0, time - delay);
            const chimeEnvelope = adjustedTime > 0 ? Math.exp(-adjustedTime * (2 + index * 0.5)) : 0;

            sample += Math.sin(2 * Math.PI * freq * adjustedTime) * chimeEnvelope * (0.8 / chimeFreqs.length);
          });

          // Add gentle noise for naturalistic texture
          const noise = (Math.random() * 2 - 1) * 0.02 * envelope;

          // Stereo separation
          const pan = channel === 0 ? 0.9 : 1.1;

          channelData[i] = (sample + noise) * volume * envelope * pan;
        }
      }

      resolve(audioBuffer);
    } catch (error) {
      reject(error);
    }
  });
};

export const playAudioBuffer = async (
  audioBuffer: AudioBuffer,
  volume: number = 1
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      source.onended = () => resolve();
      source.start();
    } catch (error) {
      reject(error);
    }
  });
};

export const loadAudioFile = async (url: string): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    const audioContext = new AudioContext();

    fetch(url)
      .then(response => response.arrayBuffer())
      .then(data => audioContext.decodeAudioData(data))
      .then(audioBuffer => resolve(audioBuffer))
      .catch(error => reject(error));
  });
};

export const preloadSounds = async (): Promise<Map<SoundType, AudioBuffer>> => {
  const soundMap = new Map<SoundType, AudioBuffer>();

  try {
    const meditationBell = await generateMeditationBell(432, 1500, 0.6);
    soundMap.set('meditation-bell', meditationBell);

    const softPiano = await generateSoftPiano(523.25, 1800, 0.5);
    soundMap.set('soft-piano', softPiano);

    const natureChime = await generateNatureChime(440, 1200, 0.55);
    soundMap.set('nature-chime', natureChime);
  } catch (error) {
    console.warn('Failed to preload generated sounds:', error);
  }

  return soundMap;
};