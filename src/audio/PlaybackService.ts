import TrackPlayer, {Event} from 'react-native-track-player';
import {cancelPracticeAudio,pausePracticeAudio} from '../learning/audio';

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => pausePracticeAudio());
  TrackPlayer.addEventListener(Event.RemoteStop, () => cancelPracticeAudio());
  TrackPlayer.addEventListener(Event.RemoteDuck, event => {if(event.paused)pausePracticeAudio();});
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
}
