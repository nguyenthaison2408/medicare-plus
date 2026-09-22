const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getDoctors,
  getSlots,
  bookAppointment,
  getAppointments,
  checkInByQR,
  saveMedicalRecord
} = require('../controllers/bookingController');

// Health Check
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ONLINE',
    service: 'MediCare Plus REST API Service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Master data
router.get('/departments', getDepartments);
router.get('/doctors', getDoctors);
router.get('/slots', getSlots);

// Appointments & Booking Flow
router.post('/appointments/book', bookAppointment);
router.get('/appointments', getAppointments);
router.post('/appointments/check-in', checkInByQR);
router.post('/appointments/:id/medical-record', saveMedicalRecord);

module.exports = router;
