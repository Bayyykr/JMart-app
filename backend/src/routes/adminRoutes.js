const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// Note: In real app, we would add authMiddleware and an admin check here
// const auth = require('../middlewares/authMiddleware');

router.put('/driver/status', adminController.updateDriverStatus);
router.get('/merchants', adminController.getMerchants);
router.put('/merchant/status', adminController.updateMerchantStatus);

module.exports = router;
