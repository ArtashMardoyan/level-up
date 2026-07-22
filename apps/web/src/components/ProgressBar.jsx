import { useLanguage } from '../hooks/useLanguage'

export default function ProgressBar({ labelKey = 'reviewedLabel', total, done }) {
  const { t } = useLanguage()
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="progress-wrap">
      <div className="progress-head">
        <span className="progress-label">{t(labelKey)}</span>
        <span className="progress-count">
          {done} / {total}
        </span>
      </div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: pct + '%' }} />
      </div>
    </div>
  )
}
