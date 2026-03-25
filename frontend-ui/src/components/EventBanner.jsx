import './EventBanner.css';

export default function EventBanner({ event, seatStats }) {
  const soldOutPct = seatStats
    ? Math.round((seatStats.sold / seatStats.total) * 100)
    : 0;

  return (
    <div className="event-banner">
      {/* Ambient glow orbs */}
      <div className="event-banner__orb event-banner__orb--blue"  aria-hidden="true" />
      <div className="event-banner__orb event-banner__orb--amber" aria-hidden="true" />

      {/* Left: visual */}
      <div className="event-banner__visual">
        <div className="event-banner__poster">
          <span className="event-banner__poster-char">♬</span>
          <div className="event-banner__poster-ring event-banner__poster-ring--1" />
          <div className="event-banner__poster-ring event-banner__poster-ring--2" />
          <div className="event-banner__poster-ring event-banner__poster-ring--3" />
        </div>
      </div>

      {/* Right: info */}
      <div className="event-banner__info">
        <div className="event-banner__tags">
          {event.tags.map(tag => (
            <span key={tag} className="event-tag">{tag}</span>
          ))}
        </div>

        <h1 className="event-banner__name">{event.name}</h1>
        <p className="event-banner__subtitle">{event.subtitle}</p>

        <div className="event-banner__meta">
          <MetaItem icon="📍" label={event.venue} sub={event.city} />
          <MetaItem icon="📅" label={event.date} sub={event.time} />
          <MetaItem icon="⏱" label={event.duration} sub={`Age: ${event.ageLimit}`} />
        </div>

        {/* Demand indicator */}
        {soldOutPct > 20 && (
          <div className="event-banner__demand">
            <span className="demand__flame">🔥</span>
            <div className="demand__text">
              <span className="demand__heading">{soldOutPct}% Sold Out</span>
              <span className="demand__sub">Extremely high demand — book now</span>
            </div>
            <div className="demand__bar-wrap">
              <div className="demand__bar">
                <div className="demand__bar-fill" style={{ width: `${soldOutPct}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaItem({ icon, label, sub }) {
  return (
    <div className="meta-item">
      <span className="meta-item__icon">{icon}</span>
      <div className="meta-item__text">
        <span className="meta-item__label">{label}</span>
        <span className="meta-item__sub">{sub}</span>
      </div>
    </div>
  );
}
