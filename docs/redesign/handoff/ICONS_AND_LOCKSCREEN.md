# App icons + iPhone lock-screen artwork

Two things were off:
1. **Favicon / app icon** — the chevron mark was too thin to read at small sizes.
2. **iPhone lock-screen art while listening** — when you background the browser and play a
   question, iOS showed a blank/generic thumbnail because the app never sets
   `navigator.mediaSession.metadata`. The MP3 path plays through an `<audio>` element, so iOS
   *will* show rich lock-screen controls + artwork once the metadata is provided.

Everything you need is in `assets/`. Nothing here touches app logic — it's icons + `<head>`
tags + one small effect.

## 1. Drop the icon files into `public/`
Copy from `assets/` → the app's `public/` folder (Vite serves `public/` at `/`):

```
public/favicon.svg          (replaces the old one — bolder chevrons)
public/favicon-32.png       (PNG fallback for old browsers)
public/apple-touch-icon.png (180×180, full-bleed — iOS rounds the corners itself)
public/icon-192.png         (192×192, rounded — manifest home-screen icon)
public/icon-512.png         (512×512, rounded — manifest home-screen icon)
public/media-art-192.png    (192×192, FULL-BLEED — media/CarPlay artwork, no transparent corners)
public/media-art-512.png    (512×512, FULL-BLEED — media/CarPlay artwork, no transparent corners)
public/manifest.webmanifest
```

## 2. `index.html` — add to `<head>`
Keep the existing `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`, then add:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#090a0e" />
<meta name="apple-mobile-web-app-title" content="Level Up" />
```

## 3. Lock-screen artwork + controls — `src/components/CoursePlayer.jsx`
Add ONE effect (it has `currentItem`, `courseId`, and the transport handlers already).
`courseTitle` — pass the course title in as a prop, or look it up from `courseId`; falls back
to a constant string if you'd rather not thread it through yet.

```jsx
// Lock-screen / control-center metadata (iOS, Android, macOS). MP3 path only —
// speech synthesis has no media session, which is fine.
useEffect(() => {
  if (!('mediaSession' in navigator) || !currentItem) return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: currentItem.question,
    artist: 'Level Up — Interview Prep',
    album: courseTitle ?? 'Interview Prep',
    artwork: [
      { src: '/media-art-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/media-art-512.png', sizes: '512x512', type: 'image/png' },
    ],
  })
  navigator.mediaSession.setActionHandler('play', handlePlayPause)
  navigator.mediaSession.setActionHandler('pause', handlePlayPause)
  navigator.mediaSession.setActionHandler('previoustrack', currentIndex > 0 ? handlePrev : null)
  navigator.mediaSession.setActionHandler(
    'nexttrack',
    currentIndex < scopedList.length - 1 ? handleNext : null
  )
}, [currentItem, courseTitle, currentIndex, scopedList.length])
```

Optional: mirror the same block in `DictionaryPlayer.jsx` for dictionary audio.

### Notes
- **CarPlay / lock-screen artwork must be full-bleed.** The home-screen icons (`icon-*.png`) have
  rounded corners with transparent pixels — good for a home screen, but CarPlay/iOS drop that
  artwork into their *own* rounded tile, so the transparent corners show through as white spots.
  The media session therefore uses `media-art-*.png` (indigo gradient filling the whole square,
  no transparency, chevron centered); the system masks the corners itself. Don't point the
  `artwork` array at the rounded `icon-*.png` files.
- Lock-screen artwork appears only for the **MP3** path (the `<audio>` element). Tracks that fall
  back to `SpeechSynthesis` have no media session — expected, no action needed.
- The play/pause state on the lock screen follows the `<audio>` element automatically; the action
  handlers above just wire the hardware/again buttons back to your transport.
- All icons are the same mark as `Logo.jsx` (indigo gradient `#818cf8 → #6366f1`, white double
  chevron-up), just bolder so it survives 16–32px and reads as artwork at 512px.
