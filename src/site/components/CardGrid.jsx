// A responsive grid of titled cards (used by "What's inside").
export default function CardGrid({ cards }) {
  return (
    <div className="mkt-cards">
      {cards.map((card) => (
        <article className="mkt-card" key={card.title}>
          <h3 className="mkt-card-title">{card.title}</h3>
          <p className="mkt-card-body">{card.body}</p>
        </article>
      ))}
    </div>
  )
}
