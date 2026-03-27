const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Dashboard Stats & Activity
router.get('/stats', authMiddleware, adminController.getDashboardStats);
router.get('/activity', authMiddleware, adminController.getRecentActivity);

// User Management
router.get('/users', authMiddleware, adminController.getAllUsers);
router.put('/user/role', authMiddleware, adminController.updateUserRole);
router.put('/user/status', authMiddleware, adminController.updateUserStatus);

// Merchant & Driver Management
router.get('/merchants', authMiddleware, adminController.getMerchants);
router.get('/drivers', authMiddleware, adminController.getDrivers);
router.put('/merchant/status', authMiddleware, adminController.updateMerchantStatus);
router.put('/driver/status', authMiddleware, adminController.updateDriverStatus);

// Reports Management
router.get('/reports', authMiddleware, adminController.getAllReports);
router.put('/report/status', authMiddleware, adminController.updateReportStatus);

// Export Data
router.get('/export/csv/:resource', authMiddleware, adminController.exportDataCSV);
router.get('/export/pdf/summary', authMiddleware, adminController.exportSystemReportPDF);

module.exports = router;
