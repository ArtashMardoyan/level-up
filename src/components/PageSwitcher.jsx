import { useEffect, useState, useRef } from 'react'

// Page header with a switcher row + a large title. The row is
// "← {backLabel}  ›  {current} ▾"; the current segment opens a dropdown of
// sibling `items` to jump between them. The big title (icon + title + subtitle)
// stays below as the page heading. Shared by the dictionary and courses.
export default function PageSwitcher({ backLabel, currentId, onSelect, subtitle, onBack, title, items, icon }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = items.find((item) => item.id === currentId)

  return (
    <>
      <div className="crumb-nav">
        <button className="crumb-back" onClick={onBack}>
          <span className="crumb-back-arrow" aria-hidden="true">
            ←
          </span>
          {backLabel}
        </button>

        <span className="crumb-sep" aria-hidden="true">
          ›
        </span>

        <div className={'crumb-switcher' + (open ? ' open' : '')} ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="crumb-current"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            {current?.icon && <span className="crumb-icon">{current.icon}</span>}
            <span className="crumb-current-label">{current?.label}</span>
            <span className="crumb-caret" aria-hidden="true">
              ▾
            </span>
          </button>

          {open && (
            <div className="crumb-menu" role="listbox">
              {items.map((item) => {
                const isActive = item.id === currentId
                return (
                  <button
                    onClick={() => {
                      setOpen(false)
                      if (!isActive) onSelect(item.id)
                    }}
                    className={'crumb-option' + (isActive ? ' active' : '')}
                    aria-selected={isActive}
                    role="option"
                    key={item.id}
                  >
                    {item.icon && <span className="crumb-icon">{item.icon}</span>}
                    <span className="crumb-option-label">{item.label}</span>
                    {isActive && (
                      <span className="crumb-check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="page-title-row">
        <div className="page-title-icon">{icon}</div>
        <div>
          <h1>{title}</h1>
          <div className="subtitle">{subtitle}</div>
        </div>
      </div>
    </>
  )
}
