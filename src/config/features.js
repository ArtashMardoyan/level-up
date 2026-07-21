// Feature flags for the AI Chat streaming migration (docs/product/ai-chat).
//
// STREAMING_CHAT toggles the interview chat between the streaming (SSE) submit
// path and the original blocking request/response path. Default ON as of the
// App Runner SSE verification (docs/product/ai-chat/012 Phase 5): streaming was
// confirmed to deliver tokens incrementally through App Runner's Envoy proxy with
// no buffering, so it is now the default for all users.
//
// Kill-switch (no rebuild needed): force the blocking path back on with
// VITE_STREAMING_CHAT=false at build time, or per-browser with
// localStorage.setItem('streamingChat', '0'). The blocking endpoint remains the
// fallback the streaming path already degrades to on any error (docs/product/ai-chat/011).

function readLocalOverride() {
  try {
    return localStorage.getItem('streamingChat') // '1' = force on, '0' = force off, null = default
  } catch {
    return null
  }
}

const local = readLocalOverride()
const env = import.meta.env.VITE_STREAMING_CHAT

export const STREAMING_CHAT = local === '0' || env === 'false' ? false : true
