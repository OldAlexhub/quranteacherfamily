import TrackPlayer, {
  Capability,
  State,
  RepeatMode,
} from 'react-native-track-player';
import {resolveAudioPath} from '../data/loaders';
import type {RecitationStyle} from '../types';

let _initialized = false;

export async function initializePlayer(): Promise<void> {
  if (_initialized) return;
  try {
    await TrackPlayer.setupPlayer({
      minBuffer: 5,
      maxBuffer: 50,
      playBuffer: 2,
    });
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      notificationCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
    });
    _initialized = true;
  } catch (e) {
    console.warn('TrackPlayer setup error:', e);
  }
}

export async function playAyah(
  surahNumber: number,
  ayahNumber: number,
  style: RecitationStyle,
): Promise<void> {
  try {
    await initializePlayer();
    const path = resolveAudioPath(surahNumber, ayahNumber, style);
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: `${surahNumber}_${ayahNumber}_${style}`,
      url: path,
      title: `${surahNumber}:${ayahNumber}`,
      artist: style === 'muallim' ? 'Muallim Style' : 'Mujawwad Style',
    });
    await TrackPlayer.play();
  } catch (e) {
    console.warn('playAyah error:', e);
  }
}

export async function playRange(
  surahNumber: number,
  startAyah: number,
  endAyah: number,
  style: RecitationStyle,
  repeatCount: number = 1,
): Promise<void> {
  try {
    await initializePlayer();
    await TrackPlayer.reset();
    const tracks = [];
    for (let i = 0; i < repeatCount; i++) {
      for (let a = startAyah; a <= endAyah; a++) {
        const path = resolveAudioPath(surahNumber, a, style);
        tracks.push({
          id: `${surahNumber}_${a}_${style}_${i}`,
          url: path,
          title: `Surah ${surahNumber}:${a}`,
          artist: style === 'muallim' ? 'Muallim Style' : 'Mujawwad Style',
        });
      }
    }
    await TrackPlayer.add(tracks);
    await TrackPlayer.play();
  } catch (e) {
    console.warn('playRange error:', e);
  }
}

export async function pauseAudio(): Promise<void> {
  try { await TrackPlayer.pause(); } catch {}
}

export async function resumeAudio(): Promise<void> {
  try { await TrackPlayer.play(); } catch {}
}

export async function stopAudio(): Promise<void> {
  try { await TrackPlayer.stop(); await TrackPlayer.reset(); } catch {}
}

export async function setPlaybackSpeed(speed: number): Promise<void> {
  try { await TrackPlayer.setRate(speed); } catch {}
}

export async function getPlayerState(): Promise<State | null> {
  try { return await TrackPlayer.getState(); } catch { return null; }
}

export async function getPosition(): Promise<number> {
  try { return await TrackPlayer.getPosition(); } catch { return 0; }
}

export async function getDuration(): Promise<number> {
  try { return await TrackPlayer.getDuration(); } catch { return 0; }
}

export async function seekTo(seconds: number): Promise<void> {
  try { await TrackPlayer.seekTo(seconds); } catch {}
}

export async function skipToNext(): Promise<void> {
  try { await TrackPlayer.skipToNext(); } catch {}
}

export async function skipToPrevious(): Promise<void> {
  try { await TrackPlayer.skipToPrevious(); } catch {}
}

export async function setRepeatMode(mode: RepeatMode): Promise<void> {
  try { await TrackPlayer.setRepeatMode(mode); } catch {}
}
