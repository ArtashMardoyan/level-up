import { useLanguage } from '../hooks/useLanguage'

export default function ProgressBar({ total, done }) {
  const { t } = useLanguage()
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="progress-wrap">
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="progress-text">{t('reviewedProgress', { total, done })}</div>
    </div>
  )
}
