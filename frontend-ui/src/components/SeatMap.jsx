import { useMemo } from 'react';
import { ROWS, SECTIONS, SEATS_PER_ROW, getSectionKeyForRow } from '../data/seatData';
import './SeatMap.css';

export default function SeatMap({ seats, flashSeat, onSeatClick }) {
  // Group rows into their sections for rendering
  const sections = useMemo(() => {
    return Object.entries(SECTIONS).map(([key, section]) => ({
      key,
      ...section,
      rows: section.rows.map(row => ({
        row,
        seats: Array.from({ length: SEATS_PER_ROW }, (_, i) => {
          const id = `${row}${i + 1}`;
          return seats[id];
        }).filter(Boolean),
      })),
    }));
  }, [seats]);

  return (
    <div className="seat-map">

      {/* ── Screen / Stage ── */}
      <div className="seat-map__stage-wrap">
        <div className="seat-map__stage-glow" aria-hidden="true" />
        <div className="seat-map__stage">
          <span>S T A G E</span>
        </div>
        <div className="seat-map__stage-perspective" aria-hidden="true" />
      </div>

      {/* ── Seat Legend ── */}
      <div className="seat-map__legend">
        <LegendItem color="seat-available" label="Available" />
        <LegendItem color="seat-selected" label="Selected" />
        <LegendItem color="seat-sold"     label="Sold Out"  />
      </div>

      {/* ── Sections ── */}
      <div className="seat-map__sections">
        {sections.map((section, sIdx) => (
          <div
            key={section.key}
            className="seat-map__section"
            style={{ '--section-color': section.color, animationDelay: `${sIdx * 0.07}s` }}
          >
            <div className="section__header">
              <div className="section__badge" style={{ background: section.color + '22', borderColor: section.color + '44', color: section.color }}>
                {section.badge}
              </div>
              <div className="section__title">{section.name}</div>
              <div className="section__price">₹{section.price.toLocaleString()}</div>
              <div className="section__desc">{section.description}</div>
            </div>

            <div className="section__rows">
              {section.rows.map(({ row, seats: rowSeats }) => (
                <div key={row} className="seat-row" data-row={row}>
                  <span className="seat-row__label">{row}</span>
                  <div className="seat-row__seats">
                    {rowSeats.map(seat => (
                      <Seat
                        key={seat.id}
                        seat={seat}
                        isFlashing={flashSeat === seat.id}
                        onClick={onSeatClick}
                      />
                    ))}
                  </div>
                  <span className="seat-row__label">{row}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Seat numbers footer ── */}
      <div className="seat-map__numbers-row">
        <span className="seat-numbers-spacer" />
        <div className="seat-numbers">
          {Array.from({ length: SEATS_PER_ROW }, (_, i) => (
            <span key={i} className="seat-number">{i + 1}</span>
          ))}
        </div>
        <span className="seat-numbers-spacer" />
      </div>
    </div>
  );
}

// ── Individual Seat ───────────────────────────────────────────────
function Seat({ seat, isFlashing, onClick }) {
  const { id, status, label, price } = seat;

  const handleClick = () => {
    if (status !== 'sold') onClick(id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const title = status === 'sold'
    ? `${label} — Sold Out`
    : status === 'selected'
    ? `${label} — Selected · ₹${price.toLocaleString()}`
    : `${label} — Available · ₹${price.toLocaleString()}`;

  return (
    <button
      className={`seat seat--${status} ${isFlashing ? 'seat--flash' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={status === 'sold'}
      title={title}
      aria-label={title}
      aria-pressed={status === 'selected'}
    />
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="legend-item">
      <span className={`legend-dot legend-dot--${color}`} />
      <span className="legend-label">{label}</span>
    </div>
  );
}
