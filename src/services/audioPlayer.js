// Single source of truth for interview audio playback.
//
// The service decides, per track, whether to play a pre-generated MP3 or fall
// back to browser SpeechSynthesis. The caller hands over `{ id, url, text, ... }`:
// `url` is the resolved MP3 address (built from the S3 key in the course data)
// or null when that track has no audio. The service plays the MP3 when a url is
// given and silently speaks `text` otherwise or on any load error. All the
// browser-specific quirks (Chrome's speak-after-cancel timing, its ~15s
// keepalive nudge, releasing the audio buffer) live here so components stay free
// of playback logic.

// Chrome silently stalls long utterances unless nudged with pause/resume.
const KEEPALIVE_INTERVAL_MS = 10000
// Chrome can drop a speak() call issued in the same tick as cancel().
const SPEAK_AFTER_CANCEL_MS = 50
const RATE_STORAGE_KEY = 'interviewPrepRate'

function readStoredRate() {
  try {
    const value = parseFloat(localStorage.getItem(RATE_STORAGE_KEY))
    return Number.isFinite(value) && value > 0 ? value : 1
  } catch {
    return 1
  }
}

function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * @typedef {Object} AudioTrack
 * @property {string} id            Stable track id, also returned by `currentInterviewId()`.
 * @property {string | null} [url]  MP3 address to play; null/omitted → speak `text` directly.
 * @property {string} text          Text spoken when there is no url / it fails to load.
 * @property {SpeechSynthesisVoice | null} [voice] Preferred voice for the fallback.
 * @property {string} [lang]        Fallback language tag (e.g. 'en-US') when no voice is set.
 * @property {() => void} [onEnded] Fired once when the track finishes (either path).
 */

class AudioPlayerService {
  constructor() {
    /** @type {HTMLAudioElement | null} reused across tracks to avoid churn */
    this.audio = null
    /** @type {'audio' | 'speech' | null} */
    this.mode = null
    /** @type {'idle' | 'loading' | 'playing' | 'paused'} */
    this.playbackStatus = 'idle'
    this.currentId = null
    // Bumped on every play()/stop() so stale async callbacks can no-op themselves.
    this.playToken = 0
    // Set when the user pauses before playback has actually started (still
    // loading) so the load-complete handler parks it paused instead of playing.
    this.pauseRequested = false
    this.keepAliveTimer = null
    this.speakTimer = null
    this.onEndedCallback = null
    // Ids known to have no MP3 this session — skip the network attempt next time.
    this.missingIds = new Set()
    this.listeners = new Set()
    // Playback speed (persisted) and current MP3 position for the seek slider.
    this.rate = readStoredRate()
    this.currentTime = 0
    this.duration = 0
    this.snapshot = { currentId: null, rate: this.rate, status: 'idle', currentTime: 0, canSeek: false, duration: 0 }
  }

  // --- React external-store binding (stable identities for useSyncExternalStore) ---

  subscribe = (listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  // --- Public transport API ---

  /** @param {AudioTrack} track */
  play = ({ lang = 'en-US', onEnded = null, voice = null, url = null, text, id }) => {
    this.stop()
    const token = ++this.playToken
    this.currentId = id
    this.onEndedCallback = onEnded
    this.pauseRequested = false

    // No MP3 for this track (or one already failed this session) → speak.
    if (!url || this.missingIds.has(id)) {
      this.speak({ voice, token, text, lang })
      return
    }

    this.setStatus('loading')
    this.playAudio({ voice, token, text, lang, url, id })
  }

  pause = () => {
    if (this.playbackStatus === 'loading') {
      // Not started yet — pausing the element now would abort the load and
      // trip the error fallback, so just remember and park it when it starts.
      this.pauseRequested = true
      this.setStatus('paused')
      return
    }
    if (this.playbackStatus !== 'playing') return
    if (this.mode === 'audio' && this.audio) {
      this.audio.pause()
    } else if (this.mode === 'speech' && speechSupported()) {
      window.speechSynthesis.pause()
    }
    this.setStatus('paused')
  }

  resume = () => {
    if (this.playbackStatus !== 'paused') return
    this.pauseRequested = false
    if (this.mode === 'audio' && this.audio) {
      const played = this.audio.play()
      if (played?.catch) played.catch(() => {})
    } else if (this.mode === 'speech' && speechSupported()) {
      window.speechSynthesis.resume()
      this.startKeepAlive()
    }
    this.setStatus('playing')
  }

  stop = () => {
    // Invalidate any in-flight callbacks before tearing resources down.
    this.playToken++
    this.pauseRequested = false
    this.teardown()
    this.onEndedCallback = null
    this.setState('idle', null)
  }

  isPlaying = () => this.playbackStatus === 'playing'

  isPaused = () => this.playbackStatus === 'paused'

  currentInterviewId = () => this.currentId

  // Playback speed applies live to MP3; speech picks it up on the next utterance.
  setRate = (rate) => {
    this.rate = rate
    try {
      localStorage.setItem(RATE_STORAGE_KEY, String(rate))
    } catch {
      /* ignore */
    }
    if (this.mode === 'audio' && this.audio) this.audio.playbackRate = rate
    this.emit()
  }

  // Seek only makes sense for MP3; speech has no timeline.
  seek = (seconds) => {
    if (this.mode !== 'audio' || !this.audio) return
    this.audio.currentTime = seconds
    this.currentTime = seconds
    this.emit()
  }

  // --- MP3 path ---

  playAudio({ voice, token, text, lang, url, id }) {
    const audio = this.ensureAudio()
    if (!audio) {
      this.speak({ voice, token, text, lang })
      return
    }
    this.mode = 'audio'
    audio.playbackRate = this.rate
    audio.ontimeupdate = () => {
      this.currentTime = audio.currentTime
      this.emit()
    }
    audio.onloadedmetadata = () => {
      this.duration = Number.isFinite(audio.duration) ? audio.duration : 0
      this.emit()
    }

    // Resolve the load exactly once: first of play()-resolved / error / rejection wins.
    let settled = false
    const settle = (ok, markMissing) => {
      if (settled || token !== this.playToken) return
      settled = true
      if (ok) {
        // The user may have paused during the load — honour it instead of playing.
        if (this.pauseRequested) {
          audio.pause()
          this.setStatus('paused')
        } else {
          this.setStatus('playing')
        }
        return
      }
      if (markMissing) this.missingIds.add(id)
      this.detachAudio()
      this.speak({ voice, token, text, lang })
    }

    audio.onended = () => {
      if (token === this.playToken) this.finish(token)
    }
    // A missing/broken/decode error caches the id (skip MP3 next time); a network
    // or aborted error is treated as transient so a later attempt can retry.
    audio.onerror = () => {
      const code = audio.error?.code
      settle(false, code !== 1 && code !== 2)
    }
    audio.src = url
    const played = audio.play()
    // A rejected play() (e.g. transient autoplay hiccup) falls back but is NOT
    // recorded as missing, so a later user gesture can retry the MP3.
    Promise.resolve(played)
      .then(() => settle(true, false))
      .catch(() => settle(false, false))
  }

  ensureAudio() {
    if (!this.audio && typeof Audio !== 'undefined') {
      this.audio = new Audio()
      this.audio.preload = 'auto'
    }
    return this.audio
  }

  detachAudio() {
    const audio = this.audio
    this.currentTime = 0
    this.duration = 0
    if (!audio) return
    audio.onended = null
    audio.onerror = null
    audio.ontimeupdate = null
    audio.onloadedmetadata = null
    audio.pause()
    // Drop the buffered media so it can be garbage-collected; keep the element.
    audio.removeAttribute('src')
    audio.load()
  }

  // --- SpeechSynthesis fallback path ---

  speak({ voice, token, text, lang }) {
    if (token !== this.playToken) return
    this.mode = 'speech'
    this.setStatus('loading')
    if (!speechSupported()) {
      this.finish(token)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = this.rate
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      utterance.lang = lang
    }
    utterance.onend = () => {
      if (token === this.playToken) this.finish(token)
    }
    // Treat a speech error as "done" — never surface it to the user.
    utterance.onerror = () => {
      if (token === this.playToken) this.finish(token)
    }

    window.speechSynthesis.cancel()
    this.speakTimer = setTimeout(() => {
      if (token !== this.playToken) return
      window.speechSynthesis.speak(utterance)
      // Honour a pause requested during the pre-speak delay.
      if (this.pauseRequested) {
        window.speechSynthesis.pause()
        this.setStatus('paused')
      } else {
        this.setStatus('playing')
        this.startKeepAlive()
      }
    }, SPEAK_AFTER_CANCEL_MS)
  }

  startKeepAlive() {
    this.stopKeepAlive()
    this.keepAliveTimer = setInterval(() => {
      const synth = window.speechSynthesis
      if (synth.speaking && !synth.paused) {
        synth.pause()
        synth.resume()
      }
    }, KEEPALIVE_INTERVAL_MS)
  }

  stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer)
      this.keepAliveTimer = null
    }
  }

  // --- Shared lifecycle ---

  finish(token) {
    if (token !== this.playToken) return
    this.teardown()
    this.setState('idle', null)
    const callback = this.onEndedCallback
    this.onEndedCallback = null
    callback?.()
  }

  teardown() {
    this.stopKeepAlive()
    if (this.speakTimer) {
      clearTimeout(this.speakTimer)
      this.speakTimer = null
    }
    if (speechSupported()) window.speechSynthesis.cancel()
    this.detachAudio()
    this.mode = null
  }

  // --- State + subscriber notification ---

  setStatus(status) {
    this.playbackStatus = status
    this.emit()
  }

  setState(status, currentId) {
    this.playbackStatus = status
    this.currentId = currentId
    this.emit()
  }

  // Rebuild the snapshot and notify listeners only when something actually changed
  // (useSyncExternalStore requires a stable reference between no-op updates).
  emit() {
    const canSeek = this.mode === 'audio'
    const prev = this.snapshot
    if (
      prev.status === this.playbackStatus &&
      prev.currentId === this.currentId &&
      prev.currentTime === this.currentTime &&
      prev.duration === this.duration &&
      prev.rate === this.rate &&
      prev.canSeek === canSeek
    ) {
      return
    }
    this.snapshot = {
      currentTime: this.currentTime,
      status: this.playbackStatus,
      currentId: this.currentId,
      duration: this.duration,
      rate: this.rate,
      canSeek
    }
    for (const listener of this.listeners) listener()
  }
}

export const audioPlayer = new AudioPlayerService()
