import './Header.css';

const SYSTEM_NODES = [
  { label: 'API Gateway',   status: 'ok'  },
  { label: 'Worker Nodes',  status: 'ok'  },
  { label: 'Redis Lock',    status: 'ok'  },
  { label: 'Database',      status: 'ok'  },
];

export default function Header({ event, seatStats }) {
  const availabilityPct = seatStats
    ? Math.round((seatStats.available / seatStats.total) * 100)
    : 100;

  return (
    <header className="header">
      <div className="header__inner">

        {/* ── Logo ── */}
        <a href="#" className="header__logo">
          <span className="header__logo-bolt">⚡</span>
          <span className="header__logo-text">TICKET<span>ENGINE</span></span>
        </a>

        {/* ── Breadcrumb ── */}
        <nav className="header__breadcrumb" aria-label="breadcrumb">
          <span>Home</span>
          <span className="header__breadcrumb-sep">/</span>
          <span>Concerts</span>
          <span className="header__breadcrumb-sep">/</span>
          <span className="header__breadcrumb-active">{event.name}</span>
        </nav>

        {/* ── System status (shows distributed architecture) ── */}
        <div className="header__sys-status">
          <span className="sys-status__label">System Status</span>
          <div className="sys-status__nodes">
            {SYSTEM_NODES.map(node => (
              <div key={node.label} className={`sys-node sys-node--${node.status}`}>
                <span className="sys-node__dot" />
                <span className="sys-node__label">{node.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Availability bar ── */}
        {seatStats && (
          <div className="header__avail">
            <span className="header__avail-text">
              {seatStats.available} seats left
            </span>
            <div className="header__avail-bar">
              <div
                className="header__avail-fill"
                style={{ width: `${availabilityPct}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Auth placeholder ── */}
        <button className="header__signin-btn">Sign In</button>
      </div>
    </header>
  );
}
