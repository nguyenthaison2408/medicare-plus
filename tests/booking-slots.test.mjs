import assert from 'node:assert/strict';
import test from 'node:test';
import { filterFutureBookingSlots, isFutureBookingSlot } from '../client/src/utils/bookingSlots.ts';

const clinicDay = { fullDate: '26/11/2026' };
const past = { id: '1', time: '08:30', status: 'available' };
const current = { id: '2', time: '09:00', status: 'available' };
const future = { id: '3', time: '09:30', status: 'available' };
const futureBooked = { id: '4', time: '10:00', status: 'booked' };
const slots = [past, current, future, futureBooked];

test('elapsed slots disappear at the exact start time in the clinic timezone', () => {
  const now = Date.parse('2026-11-26T02:00:00Z');
  assert.deepEqual(filterFutureBookingSlots(clinicDay, slots, now), [future, futureBooked]);
  assert.equal(isFutureBookingSlot(clinicDay, current, now - 1), true);
  assert.equal(isFutureBookingSlot(clinicDay, current, now), false);
});

test('a later day keeps every time slot regardless of the current time of day', () => {
  const now = Date.parse('2026-11-26T16:00:00Z');
  assert.deepEqual(filterFutureBookingSlots({ fullDate: '27/11/2026' }, slots, now), slots);
});

test('a fully elapsed day has no visible slots', () => {
  const now = Date.parse('2026-11-26T10:00:00+07:00');
  assert.deepEqual(filterFutureBookingSlots(clinicDay, slots, now), []);
});
