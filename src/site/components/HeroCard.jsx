// A product-truthful mock of the interview experience for the Home hero: a
// question, a typed answer with a blinking caret, and a live rubric score.
// Decorative — hidden from assistive tech (the hero text carries the meaning).
export default function HeroCard() {
  return (
    <div className="mkt-herocard" aria-hidden="true">
      <div className="mkt-herocard-bar">
        <span className="mkt-dotr r" />
        <span className="mkt-dotr y" />
        <span className="mkt-dotr g" />
        <span className="mkt-herocard-tab">mock interview · backend</span>
      </div>
      <div className="mkt-herocard-body">
        <div>
          <div className="mkt-herocard-qn">Question 3 / 8</div>
          <div className="mkt-herocard-q">
            Explain how you&rsquo;d prevent a race condition when two requests update the same row.
          </div>
        </div>
        <div className="mkt-herocard-answer">
          I&rsquo;d use row-level locking with <code>SELECT … FOR UPDATE</code> inside a transaction, or an optimistic
          version column…
          <span className="mkt-caret" />
        </div>
        <div className="mkt-herocard-score">
          <div className="mkt-score-ring">
            <div className="mkt-score-num">88</div>
          </div>
          <div className="mkt-score-rows">
            <div className="mkt-score-row">
              <span>Correctness</span>
              <span className="mkt-score-val">Strong</span>
            </div>
            <div className="mkt-score-row">
              <span>Communication</span>
              <span className="mkt-score-val">Add a trade-off</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
