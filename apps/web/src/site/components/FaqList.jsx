import { useState } from 'react'

// An accessible accordion of question/answer pairs. One panel open at a time is
// not enforced — each toggles independently. Buttons carry aria-expanded and
// control their panel.
export default function FaqList({ items }) {
  const [open, setOpen] = useState({})

  const toggle = (index) => setOpen((prev) => ({ ...prev, [index]: !prev[index] }))

  return (
    <div className="mkt-faq">
      {items.map((item, index) => {
        const isOpen = !!open[index]
        const panelId = 'mkt-faq-panel-' + index

        return (
          <div className="mkt-faq-item" key={item.q}>
            <button
              onClick={() => toggle(index)}
              aria-controls={panelId}
              aria-expanded={isOpen}
              className="mkt-faq-q"
              type="button"
            >
              <span>{item.q}</span>
              <span className="mkt-faq-sign" aria-hidden="true">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <p className="mkt-faq-a" id={panelId}>
                {item.a}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
