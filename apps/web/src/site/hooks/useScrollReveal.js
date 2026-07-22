import { useEffect } from 'react'

// Fades each section up as it scrolls into view. The first section (hero) is left
// visible so nothing pops on load. Disabled entirely under reduced motion. Re-runs
// when `key` changes (i.e. on page navigation) so a fresh page's sections animate.
export function useScrollReveal(key) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const sections = [...document.querySelectorAll('.mkt-main section')]
    if (!sections.length) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('mkt-in')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    )

    sections.forEach((section, index) => {
      if (index === 0) return
      section.classList.add('mkt-reveal')
      io.observe(section)
    })

    return () => io.disconnect()
  }, [key])
}
