import { MessageSquare, LineChart, Calendar, Star } from 'lucide-react'

// Maps a content-defined icon name to a lucide icon, so content.js stays plain data.
const ICONS = {
  message: MessageSquare,
  calendar: Calendar,
  chart: LineChart,
  star: Star
}

// A responsive grid of titled cards, each with an accent icon (used by "What's inside").
export default function CardGrid({ cards }) {
  return (
    <div className="mkt-cards">
      {cards.map((card) => {
        const Icon = ICONS[card.icon]

        return (
          <article className="mkt-card" key={card.title}>
            {Icon && (
              <span className="mkt-card-icon" aria-hidden="true">
                <Icon size={20} />
              </span>
            )}
            <h3 className="mkt-card-title">{card.title}</h3>
            <p className="mkt-card-body">{card.body}</p>
          </article>
        )
      })}
    </div>
  )
}
