const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

const checkMerchant = (req, res, next) => {
    if (req.user.role !== 'marketplace') {
        return res.status(403).json({ message: 'Access denied: Marketplace role required' });
    }
    next();
};

router.use(authMiddleware, checkMerchant);

router.post('/onboard', upload.fields([
    { name: 'ktp_file', maxCount: 1 },
    { name: 'selfie_file', maxCount: 1 }
]), merchantController.submitOnboarding);
router.get('/status', merchantController.getStatus);
router.get('/profile', merchantController.getProfile);
router.put('/profile', upload.single('store_image'), merchantController.updateProfile);
router.get('/stats', merchantController.getStats);
router.get('/products', merchantController.getProducts);
router.post('/products', upload.single('image'), merchantController.addProduct);
router.put('/products/:id', upload.single('image'), merchantController.updateProduct);
router.delete('/products/:id', merchantController.deleteProduct);
router.put('/products/:id/status', merchantController.toggleProductStatus);

router.get('/orders', merchantController.getOrders);
router.put('/orders/:id/status', merchantController.updateOrderStatus);
router.put('/orders/:id/accept', merchantController.acceptOrder);
router.put('/orders/:id/reject', merchantController.rejectOrder);
router.post('/orders/:id/sewa-driver', merchantController.sewaDriver);

module.exports = router;
