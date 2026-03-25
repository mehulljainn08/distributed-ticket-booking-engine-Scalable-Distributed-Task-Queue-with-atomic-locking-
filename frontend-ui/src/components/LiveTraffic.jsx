import { useState, useEffect } from 'react';
import './LiveTraffic.css';

// Simulates the distributed system's concurrent user load
// In production: this data would come from a real-time analytics endpoint
const BASE_USERS = 2847;

export default function LiveTraffic({ soldCount, totalCount }) {
  const [userCount, setUserCount] = useState(BASE_USERS);
  const [queueDepth, setQueueDepth] = useState(143);
  const [latency, setLatency] = useState(12);
  const [tick, setTick] = useState(0);

  // Simulate live fluctuating user count (replace with real analytics later)
  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount(prev => {
        const delta = Math.floor(Math.random() * 40) - 15;
        return Math.max(2400, Math.min(3500, prev + delta));
      });
      setQueueDepth(prev => {
        const delta = Math.floor(Math.random() * 20) - 8;
        return Math.max(80, Math.min(300, prev + delta));
      });
      setLatency(Math.floor(Math.random() * 8) + 9);
      setTick(t => t + 1);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const soldPct = totalCount ? Math.round((soldCount / totalCount) * 100) : 0;
  const demand = userCount > 3000 ? 'Critical' : userCount > 2600 ? 'High' : 'Moderate';
  const demandClass = userCount > 3000 ? 'critical' : userCount > 2600 ? 'high' : 'moderate';

  return (
    <div className="live-traffic">

      {/* Live users */}
      <div className="lt-stat lt-stat--users">
        <div className="lt-live-badge">
          <span className="lt-live-dot" />
          <span>LIVE</span>
        </div>
        <div className="lt-stat__value" key={tick}>
          {userCount.toLocaleString()}
        </div>
        <div className="lt-stat__label">concurrent users</div>
      </div>

      <div className="lt-divider" />

      {/* Request queue depth */}
      <div className="lt-stat">
        <div className="lt-stat__icon">📬</div>
        <div className="lt-stat__value lt-stat__value--sm">{queueDepth}</div>
        <div className="lt-stat__label">queue depth</div>
      </div>

      <div className="lt-divider" />

      {/* API latency */}
      <div className="lt-stat">
        <div className="lt-stat__icon">⚡</div>
        <div className="lt-stat__value lt-stat__value--sm lt-stat__value--green">{latency}ms</div>
        <div className="lt-stat__label">API latency</div>
      </div>

      <div className="lt-divider" />

      {/* Demand level */}
      <div className="lt-stat">
        <div className="lt-stat__icon">📈</div>
        <div className={`lt-demand lt-demand--${demandClass}`}>{demand}</div>
        <div className="lt-stat__label">demand level</div>
      </div>

      <div className="lt-divider" />

      {/* Redis lock indicator */}
      <div className="lt-stat">
        <div className="lt-stat__icon">🔐</div>
        <div className="lt-stat__value lt-stat__value--sm lt-stat__value--green">Active</div>
        <div className="lt-stat__label">Redis locks</div>
      </div>

    </div>
  );
}
