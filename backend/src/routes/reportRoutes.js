const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, reportController.submitReport);
router.get('/my-reports', authMiddleware, reportController.getMyReports);

module.exports = router;
