import { useEffect, useState } from 'react';
import './WaitlistModal.css';

// ── Progress steps reflecting the distributed booking pipeline ──
const PIPELINE_STEPS = [
  { key: 'gateway',  label: 'API Gateway received request',        icon: '📡', delay: 0     },
  { key: 'redis',    label: 'Redis atomic lock acquired',           icon: '🔐', delay: 600   },
  { key: 'queue',    label: 'Queued in worker node pipeline',       icon: '📬', delay: 1200  },
  { key: 'db',       label: 'Awaiting database write confirmation', icon: '🗄',  delay: 2000  },
];

export default function WaitlistModal({ phase, waitlistInfo, errorMsg, onClose }) {
  const isError = phase === 'error';
  const [activeStep, setActiveStep] = useState(-1);
  const [copyDone, setCopyDone] = useState(false);

  // Animate pipeline steps progressively
  useEffect(() => {
    if (isError) return;
    PIPELINE_STEPS.forEach((step, idx) => {
      setTimeout(() => setActiveStep(idx), step.delay + 200);
    });
  }, [isError]);

  const handleCopyId = () => {
    if (!waitlistInfo?.waitlistId) return;
    navigator.clipboard.writeText(waitlistInfo.waitlistId).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={`modal-content modal-content--${isError ? 'error' : 'success'}`}>

        {/* Close button */}
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {isError ? (
          <ErrorContent errorMsg={errorMsg} onClose={onClose} />
        ) : (
          <SuccessContent
            waitlistInfo={waitlistInfo}
            activeStep={activeStep}
            copyDone={copyDone}
            onCopyId={handleCopyId}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// ── Success state ─────────────────────────────────────────────────
function SuccessContent({ waitlistInfo, activeStep, copyDone, onCopyId, onClose }) {
  return (
    <>
      {/* Header */}
      <div className="modal-header modal-header--success">
        <div className="modal-icon modal-icon--success">
          <span>✓</span>
          <div className="modal-icon__ring modal-icon__ring--1" />
          <div className="modal-icon__ring modal-icon__ring--2" />
        </div>
        <div>
          <h2 className="modal-title">Request Submitted!</h2>
          <p className="modal-subtitle">Your booking is queued in the distributed pipeline</p>
        </div>
      </div>

      {/* Waitlist ID — the key deliverable */}
      <div className="modal-waitlist-id">
        <div className="waitlist-id__label">
          <span>Waitlist ID</span>
          <span className="waitlist-id__badge">From API Gateway</span>
        </div>
        <div className="waitlist-id__value">
          <span className="waitlist-id__code">{waitlistInfo?.waitlistId || 'WL-XXXXXX'}</span>
          <button
            className={`waitlist-id__copy ${copyDone ? 'waitlist-id__copy--done' : ''}`}
            onClick={onCopyId}
          >
            {copyDone ? '✓ Copied' : '⎘ Copy'}
          </button>
        </div>
      </div>

      {/* Queue metadata */}
      {waitlistInfo && (
        <div className="modal-meta-grid">
          <MetaCard icon="📍" label="Queue Position" value={`#${waitlistInfo.position}`} />
          <MetaCard icon="⏱" label="Est. Processing" value={`~${waitlistInfo.estimatedTime}s`} />
          <MetaCard icon="⚙" label="Worker Node"    value={waitlistInfo.workerNode || 'worker-1'} />
          <MetaCard icon="🔐" label="Redis Lock"    value={waitlistInfo.redisLockAcquired ? 'Acquired' : 'Pending'} highlight />
        </div>
      )}

      {/* Distributed pipeline visualization */}
      <div className="modal-pipeline">
        <div className="pipeline__title">Booking Pipeline Status</div>
        <div className="pipeline__steps">
          {PIPELINE_STEPS.map((step, idx) => (
            <PipelineStep
              key={step.key}
              step={step}
              isActive={idx <= activeStep}
              isLast={idx === PIPELINE_STEPS.length - 1}
              isPending={idx > activeStep}
            />
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="modal-info-note">
        <span>💡</span>
        <span>
          Your seats are <strong>temporarily locked</strong> via Redis. The booking is being processed
          asynchronously by worker nodes. You'll receive a socket notification when confirmed.
        </span>
      </div>

      {/* Actions */}
      <div className="modal-actions">
        <button className="modal-btn modal-btn--secondary" onClick={onClose}>
          Continue Browsing
        </button>
        <button className="modal-btn modal-btn--primary" onClick={onClose}>
          Track Booking →
        </button>
      </div>
    </>
  );
}

// ── Error state ───────────────────────────────────────────────────
function ErrorContent({ errorMsg, onClose }) {
  return (
    <>
      <div className="modal-header modal-header--error">
        <div className="modal-icon modal-icon--error">
          <span>!</span>
        </div>
        <div>
          <h2 className="modal-title">Request Failed</h2>
          <p className="modal-subtitle">The API Gateway returned an error</p>
        </div>
      </div>

      <div className="modal-error-detail">
        <div className="error-detail__label">Error Details</div>
        <div className="error-detail__msg">{errorMsg || 'Worker queue at capacity. This is expected under high concurrency.'}</div>
      </div>

      <div className="modal-info-note modal-info-note--error">
        <span>🔄</span>
        <span>
          This can happen under extreme concurrency. Your seats were <strong>not charged</strong>.
          Redis released the lock. Please try booking again.
        </span>
      </div>

      <div className="modal-actions">
        <button className="modal-btn modal-btn--primary modal-btn--full" onClick={onClose}>
          Try Again
        </button>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────
function PipelineStep({ step, isActive, isLast, isPending }) {
  return (
    <div className="pipeline-step">
      <div className="pipeline-step__left">
        <div className={`pipeline-step__dot ${isActive ? 'pipeline-step__dot--active' : ''} ${isPending ? 'pipeline-step__dot--pending' : ''}`}>
          {isActive ? '✓' : <span className="pipeline-step__num" />}
        </div>
        {!isLast && (
          <div className={`pipeline-step__line ${isActive ? 'pipeline-step__line--active' : ''}`} />
        )}
      </div>
      <div className="pipeline-step__content">
        <span className="pipeline-step__icon">{step.icon}</span>
        <span className={`pipeline-step__label ${isPending ? 'pipeline-step__label--pending' : ''}`}>
          {step.label}
        </span>
        {isPending && <span className="pipeline-step__pending-tag">pending</span>}
      </div>
    </div>
  );
}

function MetaCard({ icon, label, value, highlight }) {
  return (
    <div className={`meta-card ${highlight ? 'meta-card--highlight' : ''}`}>
      <span className="meta-card__icon">{icon}</span>
      <div className="meta-card__body">
        <span className="meta-card__label">{label}</span>
        <span className="meta-card__value">{value}</span>
      </div>
    </div>
  );
}
