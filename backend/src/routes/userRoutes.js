const express = require('express');
const router = express.Router();

const antarJemputController = require('../controllers/antarJemputController');
const jasaTitipController = require('../controllers/jasaTitipController');
const marketplaceController = require('../controllers/marketplaceController');
const orderController = require('../controllers/orderController');
const dashboardController = require('../controllers/dashboardController');
const broadcastController = require('../controllers/broadcastController');

const { authMiddleware } = require('../middlewares/authMiddleware');

// Feature data endpoints
router.get('/drivers', authMiddleware, antarJemputController.getDrivers);
router.get('/jastips', authMiddleware, jasaTitipController.getJastips);
router.post('/jastips/join', authMiddleware, jasaTitipController.joinJastip);
router.get('/products', authMiddleware, marketplaceController.getProducts);

// Order endpoints
router.get('/orders', authMiddleware, orderController.getOrders);
router.post('/orders', authMiddleware, orderController.createOrder);

// Broadcast endpoints
router.get('/broadcasts', authMiddleware, broadcastController.getMyBroadcasts);
router.post('/broadcasts', authMiddleware, broadcastController.createBroadcast);
router.get('/broadcasts/:id/offers', authMiddleware, broadcastController.getBroadcastOffers);
router.post('/broadcasts/accept-offer', authMiddleware, broadcastController.acceptOffer);
router.post('/broadcasts/reject-offer', authMiddleware, broadcastController.rejectOffer);

// Dashboard endpoints
router.get('/dashboard/stats', authMiddleware, dashboardController.getStats);
router.get('/dashboard/recent-orders', authMiddleware, dashboardController.getRecentOrders);

// User profile endpoint — returns fresh user data including profile_image_url
router.get('/me', authMiddleware, async (req, res) => {
    const userRepository = require('../repositories/UserRepository');
    try {
        const user = await userRepository.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user profile endpoint
router.put('/profile', authMiddleware, async (req, res) => {
    const db = require('../config/db');
    try {
        const { name, phone, birthdate, address } = req.body;
        
        await db.execute(
            'UPDATE users SET name = ?, phone = ?, birthdate = ?, address = ? WHERE id = ?',
            [name || null, phone || null, birthdate || null, address || null, req.user.id]
        );
        
        const userRepository = require('../repositories/UserRepository');
        const updatedUser = await userRepository.findById(req.user.id);
        
        res.json({ message: 'Profil berhasil diperbarui', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

const upload = require('../middlewares/uploadMiddleware');

// Update user profile image endpoint
router.post('/profile-image', authMiddleware, upload.single('image'), async (req, res) => {
    const db = require('../config/db');
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }
        
        const imageUrl = `/uploads/${req.file.filename}`;
        
        await db.execute('UPDATE users SET profile_image_url = ? WHERE id = ?', [imageUrl, req.user.id]);
        
        const userRepository = require('../repositories/UserRepository');
        const updatedUser = await userRepository.findById(req.user.id);
        
        res.json({ message: 'Foto profil berhasil diperbarui', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
