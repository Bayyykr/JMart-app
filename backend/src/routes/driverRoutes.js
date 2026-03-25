const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/status', authMiddleware, driverController.getDriverStatus);
router.get('/stats', authMiddleware, driverController.getDriverStats);
router.post('/onboard',
    authMiddleware,
    upload.fields([
        { name: 'ktp_file', maxCount: 1 },
        { name: 'selfie_file', maxCount: 1 }
    ]),
    driverController.submitOnboarding
);
router.put('/status', authMiddleware, driverController.updateStatus);
router.put('/location', authMiddleware, driverController.updateLocation);
router.get('/orders', authMiddleware, driverController.getDriverOrders);

// Broadcast endpoints
const broadcastController = require('../controllers/broadcastController');
router.get('/broadcasts/available', authMiddleware, broadcastController.getAvailableBroadcasts);
router.post('/broadcasts/offer', authMiddleware, broadcastController.makeOffer);

// Jastip endpoints
const jasaTitipController = require('../controllers/jasaTitipController');
router.get('/jastips', authMiddleware, jasaTitipController.getDriverJastips);
router.post('/jastips', authMiddleware, jasaTitipController.createJastip);
router.post('/jastips/accept-order', authMiddleware, jasaTitipController.acceptJastipOrder);
router.get('/jastips/:id', authMiddleware, jasaTitipController.getJastipDetails);

module.exports = router;
