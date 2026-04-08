-- Seed Data for Distributed Ticket Booking Engine

-- Insert Users
INSERT INTO users (id, name, email) VALUES
('u1111111-1111-1111-1111-111111111111', 'John Doe', 'john@example.com'),
('u2222222-2222-2222-2222-222222222222', 'Jane Smith', 'jane@example.com')
ON CONFLICT (email) DO NOTHING;

-- Insert an Event
INSERT INTO events (id, title, description, event_date, location) VALUES
('e1111111-1111-1111-1111-111111111111', 'Grand Concert 2026', 'A massive musical event featuring top artists.', '2026-05-20 19:00:00+00', 'Wembley Stadium')
ON CONFLICT (id) DO NOTHING;

-- Insert Seats for the Event (Row A and B)
INSERT INTO seats (event_id, row_label, seat_number, price, status) VALUES
('e1111111-1111-1111-1111-111111111111', 'A', 1, 150.00, 'available'),
('e1111111-1111-1111-1111-111111111111', 'A', 2, 150.00, 'available'),
('e1111111-1111-1111-1111-111111111111', 'A', 3, 150.00, 'available'),
('e1111111-1111-1111-1111-111111111111', 'A', 4, 150.00, 'available'),
('e1111111-1111-1111-1111-111111111111', 'A', 5, 150.00, 'available'),
('e1111111-1111-1111-1111-111111111111', 'B', 1, 100.00, 'available'),
('e1111111-1111-1111-1111-111111111111', 'B', 2, 100.00, 'available'),
('e1111111-1111-1111-1111-111111111111', 'B', 3, 100.00, 'available'),
('e1111111-1111-1111-1111-111111111111', 'B', 4, 100.00, 'available'),
('e1111111-1111-1111-1111-111111111111', 'B', 5, 100.00, 'available')
ON CONFLICT (event_id, row_label, seat_number) DO NOTHING;
