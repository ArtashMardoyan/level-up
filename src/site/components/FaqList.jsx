// A description list of question/answer pairs — semantic and scannable.
export default function FaqList({ items }) {
  return (
    <dl className="mkt-faq">
      {items.map((item) => (
        <div className="mkt-faq-item" key={item.q}>
          <dt className="mkt-faq-q">{item.q}</dt>
          <dd className="mkt-faq-a">{item.a}</dd>
        </div>
      ))}
    </dl>
  )
}
