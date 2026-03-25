// ═══════════════════════════════════════════════════════════════
// seatData.js — Static seat configuration & initialization
// Central source of truth for seat layout, pricing, and sections
// ═══════════════════════════════════════════════════════════════

/** Section definitions — pricing, row mapping, display metadata */
export const SECTIONS = {
  PLATINUM: {
    key: 'PLATINUM',
    name: 'Platinum',
    rows: ['A', 'B'],
    price: 4500,
    colorVar: '--section-platinum',
    color: '#f0a000',
    badge: '⭐ Premium',
    description: 'Best view · Front section',
  },
  GOLD: {
    key: 'GOLD',
    name: 'Gold',
    rows: ['C', 'D', 'E'],
    price: 3000,
    colorVar: '--section-gold',
    color: '#a78bfa',
    badge: '✦ Popular',
    description: 'Great view · Mid section',
  },
  SILVER: {
    key: 'SILVER',
    name: 'Silver',
    rows: ['F', 'G', 'H'],
    price: 1500,
    colorVar: '--section-silver',
    color: '#60a5fa',
    badge: 'Standard',
    description: 'Good view · Upper mid',
  },
  GENERAL: {
    key: 'GENERAL',
    name: 'General',
    rows: ['I', 'J'],
    price: 800,
    colorVar: '--section-general',
    color: '#6b7280',
    badge: 'Budget',
    description: 'Value section · Rear',
  },
};

export const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const SEATS_PER_ROW = 12;
export const MAX_SELECTABLE = 6;

/**
 * Pre-sold seats for demo realism (~35% of total seats).
 * In production, this state comes from the database via API.
 */
const PRESOLD_SEATS = new Set([
  // Row A (Platinum)
  'A2', 'A4', 'A7', 'A10', 'A11',
  // Row B (Platinum)
  'B1', 'B3', 'B6', 'B9',
  // Row C (Gold)
  'C2', 'C5', 'C8', 'C11',
  // Row D (Gold)
  'D1', 'D4', 'D7', 'D9', 'D12',
  // Row E (Gold)
  'E3', 'E6', 'E8', 'E11',
  // Row F (Silver)
  'F2', 'F5', 'F8', 'F10',
  // Row G (Silver)
  'G1', 'G4', 'G7', 'G9', 'G12',
  // Row H (Silver)
  'H3', 'H6', 'H8', 'H11',
  // Row I (General)
  'I2', 'I5', 'I8', 'I10', 'I12',
  // Row J (General)
  'J1', 'J4', 'J7', 'J9',
]);

/** Map row letter → section key */
export function getSectionKeyForRow(row) {
  for (const [key, section] of Object.entries(SECTIONS)) {
    if (section.rows.includes(row)) return key;
  }
  return 'GENERAL';
}

/** Get price for a given row */
export function getPriceForRow(row) {
  return SECTIONS[getSectionKeyForRow(row)].price;
}

/**
 * Generate the initial seat map.
 * Returns a flat object: { [seatId]: SeatObject }
 *
 * Future: Replace PRESOLD_SEATS with data fetched from API.
 * The shape of each SeatObject is the contract with backend.
 */
export function generateSeats() {
  const seats = {};

  ROWS.forEach(row => {
    for (let num = 1; num <= SEATS_PER_ROW; num++) {
      const id = `${row}${num}`;
      const sectionKey = getSectionKeyForRow(row);
      seats[id] = {
        id,
        row,
        number: num,
        label: `${row}${num}`,
        // 'available' | 'selected' | 'sold'
        status: PRESOLD_SEATS.has(id) ? 'sold' : 'available',
        section: sectionKey,
        sectionName: SECTIONS[sectionKey].name,
        price: SECTIONS[sectionKey].price,
        color: SECTIONS[sectionKey].color,
      };
    }
  });

  return seats;
}

/** Group seats by section for display in BookingSummary */
export function groupSeatsBySection(seatObjects) {
  const groups = {};
  seatObjects.forEach(seat => {
    const key = seat.section;
    if (!groups[key]) {
      groups[key] = {
        sectionKey: key,
        sectionName: SECTIONS[key].name,
        price: SECTIONS[key].price,
        color: SECTIONS[key].color,
        seats: [],
      };
    }
    groups[key].seats.push(seat);
  });
  return Object.values(groups);
}

/** Get seat availability stats */
export function getSeatStats(seats) {
  const values = Object.values(seats);
  return {
    total:     values.length,
    available: values.filter(s => s.status === 'available').length,
    sold:      values.filter(s => s.status === 'sold').length,
    selected:  values.filter(s => s.status === 'selected').length,
  };
}
