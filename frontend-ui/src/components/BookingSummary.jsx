import { useMemo } from 'react';
import { groupSeatsBySection, SECTIONS } from '../data/seatData';
import './BookingSummary.css';

const BOOKING_FEE_PER_TICKET = 50;
const CONVENIENCE_FEE_RATE   = 0.02;

export default function BookingSummary({
  seats,
  selectedSeats,
  totalAmount,
  phase,
  errorMsg,
  onBook,
  onDeselect,
}) {
  const isSubmitting = phase === 'submitting';
  const isError      = phase === 'error';

  const sectionGroups = useMemo(
    () => groupSeatsBySection(selectedSeats),
    [selectedSeats]
  );

  const bookingFee      = selectedSeats.length * BOOKING_FEE_PER_TICKET;
  const convenienceFee  = Math.round(totalAmount * CONVENIENCE_FEE_RATE);
  const grandTotal      = totalAmount + bookingFee + convenienceFee;

  return (
    <div className="booking-summary">
      {/* Header */}
      <div className="bs-header">
        <h2 className="bs-header__title">Booking Summary</h2>
        {selectedSeats.length > 0 && (
          <span className="bs-header__count">{selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Empty state */}
      {selectedSeats.length === 0 ? (
        <div className="bs-empty">
          <div className="bs-empty__icon">🪑</div>
          <p className="bs-empty__title">No seats selected</p>
          <p className="bs-empty__sub">Click any green seat on the map to select it. Up to 6 seats per booking.</p>
        </div>
      ) : (
        <>
          {/* Selected seats by section */}
          <div className="bs-seats">
            {sectionGroups.map(group => (
              <div key={group.sectionKey} className="bs-section">
                <div className="bs-section__header">
                  <span
                    className="bs-section__dot"
                    style={{ background: group.color }}
                  />
                  <span className="bs-section__name">{group.sectionName}</span>
                  <span className="bs-section__unit-price">₹{group.price.toLocaleString()} ea</span>
                </div>
                <div className="bs-section__seats">
                  {group.seats.map(seat => (
                    <SeatChip
                      key={seat.id}
                      seat={seat}
                      onRemove={onDeselect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="bs-breakdown">
            <div className="bs-breakdown__row">
              <span>Seat total</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="bs-breakdown__row">
              <span>Booking fee ({selectedSeats.length}×₹{BOOKING_FEE_PER_TICKET})</span>
              <span>₹{bookingFee.toLocaleString()}</span>
            </div>
            <div className="bs-breakdown__row">
              <span>Convenience fee (2%)</span>
              <span>₹{convenienceFee.toLocaleString()}</span>
            </div>
            <div className="bs-breakdown__total">
              <span>Total</span>
              <span className="bs-breakdown__total-amount">
                ₹{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Architecture note */}
          <div className="bs-arch-note">
            <span className="bs-arch-note__icon">⚡</span>
            <span>Your request is sent to the API Gateway which returns a <strong>Waitlist ID</strong> immediately. Worker nodes process asynchronously.</span>
          </div>
        </>
      )}

      {/* Error state */}
      {isError && (
        <div className="bs-error">
          <span>⚠ {errorMsg || 'Booking failed. Your seats are still available.'}</span>
        </div>
      )}

      {/* Book button */}
      <button
        className={`bs-book-btn ${isSubmitting ? 'bs-book-btn--loading' : ''} ${selectedSeats.length === 0 ? 'bs-book-btn--disabled' : ''}`}
        onClick={onBook}
        disabled={selectedSeats.length === 0 || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="bs-book-btn__spinner" />
            <span>Submitting to API Gateway…</span>
          </>
        ) : (
          <>
            <span>⚡</span>
            <span>
              {selectedSeats.length === 0
                ? 'Select Seats to Book'
                : `Book ${selectedSeats.length} Ticket${selectedSeats.length !== 1 ? 's' : ''} · ₹${grandTotal.toLocaleString()}`}
            </span>
          </>
        )}
      </button>

      {/* Trust indicators */}
      <div className="bs-trust">
        <span>🔒 Secured by Redis atomic lock</span>
        <span>•</span>
        <span>⚙ 4 worker nodes active</span>
      </div>
    </div>
  );
}

function SeatChip({ seat, onRemove }) {
  return (
    <div className="seat-chip">
      <span className="seat-chip__id">{seat.id}</span>
      <button
        className="seat-chip__remove"
        onClick={() => onRemove(seat.id)}
        aria-label={`Remove seat ${seat.id}`}
      >
        ×
      </button>
    </div>
  );
}
