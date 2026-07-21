// Feature flags for the AI Chat streaming migration (docs/ai-chat).
//
// STREAMING_CHAT toggles the interview chat between the streaming (SSE) submit
// path and the original blocking request/response path. Default OFF — the
// migration is additive and byte-identical with the flag off (docs/ai-chat/012
// Phase 3). Turn on per-environment with VITE_STREAMING_CHAT=true at build time,
// or per-browser at runtime with localStorage.setItem('streamingChat', '1') (no
// rebuild) for testing and gradual rollout. Phase 5 flips the default on.

function readLocalOverride() {
  try {
    return localStorage.getItem('streamingChat') === '1'
  } catch {
    return false
  }
}

export const STREAMING_CHAT = import.meta.env.VITE_STREAMING_CHAT === 'true' || readLocalOverride()
