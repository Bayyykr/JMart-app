const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/send', authMiddleware, chatController.sendMessage);
router.get('/history/:roomId', authMiddleware, chatController.getChatHistory);
router.get('/details/:roomId', authMiddleware, chatController.getRoomDetails);
router.get('/list', authMiddleware, chatController.getChatList);
router.put('/read/:roomId', authMiddleware, chatController.markAsRead);
router.delete('/clear/:roomId', authMiddleware, chatController.clearChat);
router.post('/upload', authMiddleware, upload.single('file'), chatController.uploadFile);
router.get('/unread-total', authMiddleware, chatController.getTotalUnreadApi);
router.post('/room', authMiddleware, chatController.createOrGetRoom);
router.post('/proposal/accept', authMiddleware, chatController.acceptProposal);
router.post('/proposal/reject', authMiddleware, chatController.rejectProposal);

module.exports = router;
