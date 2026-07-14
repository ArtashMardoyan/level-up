import { useSyncExternalStore } from 'react'

import { audioPlayer } from '../services/audioPlayer'

// Reactive view of the shared AudioPlayerService: returns the live snapshot
// { status, currentId, currentTime, duration, rate, canSeek }. Imperative
// controls (play/pause/seek/setRate/…) are called on `audioPlayer` directly.
export function useAudioPlayer() {
  return useSyncExternalStore(audioPlayer.subscribe, audioPlayer.getSnapshot)
}
