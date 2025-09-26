import { useState, useEffect, useCallback, useRef } from 'react';
import type { SoundType, AudioSettings } from '../utils/audioUtils';
import {
  defaultAudioSettings,
  preloadSounds,
  playAudioBuffer,
  generateMeditationBell,
  generateSoftPiano,
  generateNatureChime,
  isValidSoundType
} from '../utils/audioUtils';

const AUDIO_SETTINGS_KEY = 'learning-timer-audio-settings';

export const useAudio = () => {
  const [settings, setSettings] = useState<AudioSettings>(defaultAudioSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const soundCacheRef = useRef<Map<SoundType, AudioBuffer>>(new Map());

  const loadSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (saved) {
        const parsedSettings = JSON.parse(saved);

        // Validate and migrate old sound types
        const validatedSettings = {
          ...defaultAudioSettings,
          ...parsedSettings
        };

        // If the saved sound type is invalid (from old version), use default
        if (!isValidSoundType(validatedSettings.soundType)) {
          console.warn(`Invalid sound type "${validatedSettings.soundType}" found in saved settings. Using default.`);
          validatedSettings.soundType = defaultAudioSettings.soundType;
          // Save the corrected settings back to localStorage
          localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(validatedSettings));
        }

        setSettings(validatedSettings);
      }
    } catch (err) {
      console.warn('Failed to load audio settings:', err);
      setSettings(defaultAudioSettings);
    }
  }, []);

  const saveSettings = useCallback((newSettings: AudioSettings) => {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (err) {
      console.warn('Failed to save audio settings:', err);
      setError('Failed to save audio settings');
    }
  }, []);

  const initializeAudio = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const soundMap = await preloadSounds();
      soundCacheRef.current = soundMap;
    } catch (err) {
      console.warn('Failed to preload sounds:', err);
      setError('Failed to initialize audio');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const playSound = useCallback(async (
    soundType: SoundType = 'completion',
    customVolume?: number
  ) => {
    if (!settings.enabled || isPlaying) {
      return;
    }

    const volume = customVolume ?? settings.volume;

    try {
      setIsPlaying(true);
      setError(null);

      let audioBuffer = soundCacheRef.current.get(soundType);

      if (!audioBuffer) {
        switch (soundType) {
          case 'meditation-bell':
            audioBuffer = await generateMeditationBell(432, 1500, 0.6);
            break;
          case 'soft-piano':
            audioBuffer = await generateSoftPiano(523.25, 1800, 0.5);
            break;
          case 'nature-chime':
            audioBuffer = await generateNatureChime(440, 1200, 0.55);
            break;
          default:
            audioBuffer = await generateMeditationBell(432, 1500, 0.6);
        }

        soundCacheRef.current.set(soundType, audioBuffer);
      }

      await playAudioBuffer(audioBuffer, volume);
    } catch (err) {
      console.warn('Failed to play sound:', err);
      setError('Failed to play sound');
    } finally {
      setIsPlaying(false);
    }
  }, [settings.enabled, settings.volume, isPlaying]);

  const toggleEnabled = useCallback(() => {
    const newSettings = { ...settings, enabled: !settings.enabled };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const newSettings = { ...settings, volume: clampedVolume };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const setSoundType = useCallback((soundType: SoundType) => {
    const newSettings = { ...settings, soundType };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const testSound = useCallback(async () => {
    await playSound(settings.soundType);
  }, [playSound, settings.soundType]);

  useEffect(() => {
    loadSettings();
    initializeAudio();
  }, [loadSettings, initializeAudio]);

  return {
    settings,
    isLoading,
    isPlaying,
    error,
    playSound,
    toggleEnabled,
    setVolume,
    setSoundType,
    testSound,
    initializeAudio
  };
};