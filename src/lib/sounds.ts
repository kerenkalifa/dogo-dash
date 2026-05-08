export type SoundId = 'chime' | 'bell' | 'soft-alarm' | 'dog-bark';

export const SOUNDS: { id: SoundId; labelKey: string; src: string }[] = [
  { id: 'chime', labelKey: 'sound_chime', src: '/sounds/chime.mp3' },
  { id: 'bell', labelKey: 'sound_bell', src: '/sounds/bell.mp3' },
  { id: 'soft-alarm', labelKey: 'sound_alarm', src: '/sounds/soft-alarm.mp3' },
  { id: 'dog-bark', labelKey: 'sound_bark', src: '/sounds/dog-bark.mp3' },
];

export const getSoundSrc = (id: SoundId) =>
  SOUNDS.find((s) => s.id === id)?.src ?? SOUNDS[0].src;

let previewAudio: HTMLAudioElement | null = null;
export const previewSound = (id: SoundId) => {
  try {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    previewAudio = new Audio(getSoundSrc(id));
    previewAudio.volume = 0.9;
    void previewAudio.play();
  } catch {
    /* ignore */
  }
};
