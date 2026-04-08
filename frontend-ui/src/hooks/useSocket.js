import { useEffect, useRef, useCallback } from 'react'
import { getSocket, SOCKET_EVENTS } from '../services/socket'

/**
 * useSocket
 * Safely subscribes to socket events and cleans up on unmount.
 *
 * @param {Object} handlers - { onSeatUpdated, onBookingConfirmed, onBookingFailed }
 */
export const useSocket = ({ onSeatUpdated, onBookingConfirmed, onBookingFailed } = {}) => {
  const socketRef = useRef(null)

  // Stable refs to avoid re-subscribing when handlers change
  const onSeatUpdatedRef = useRef(onSeatUpdated)
  const onBookingConfirmedRef = useRef(onBookingConfirmed)
  const onBookingFailedRef = useRef(onBookingFailed)

  useEffect(() => {
    onSeatUpdatedRef.current = onSeatUpdated
    onBookingConfirmedRef.current = onBookingConfirmed
    onBookingFailedRef.current = onBookingFailed
  })

  useEffect(() => {
    let sock
    try {
      sock = getSocket()
      socketRef.current = sock
    } catch (err) {
      console.error('[useSocket] Failed to get socket:', err)
      return
    }

    const handleSeatUpdated = (data) => {
      onSeatUpdatedRef.current?.(data)
    }
    const handleBookingConfirmed = (data) => {
      onBookingConfirmedRef.current?.(data)
    }
    const handleBookingFailed = (data) => {
      onBookingFailedRef.current?.(data)
    }

    sock.on(SOCKET_EVENTS.SEAT_UPDATED, handleSeatUpdated)
    sock.on(SOCKET_EVENTS.BOOKING_CONFIRMED, handleBookingConfirmed)
    sock.on(SOCKET_EVENTS.BOOKING_FAILED, handleBookingFailed)

    return () => {
      sock.off(SOCKET_EVENTS.SEAT_UPDATED, handleSeatUpdated)
      sock.off(SOCKET_EVENTS.BOOKING_CONFIRMED, handleBookingConfirmed)
      sock.off(SOCKET_EVENTS.BOOKING_FAILED, handleBookingFailed)
    }
  }, []) // subscribe once

  const isConnected = useCallback(() => {
    return socketRef.current?.connected ?? false
  }, [])

  return { isConnected }
}
