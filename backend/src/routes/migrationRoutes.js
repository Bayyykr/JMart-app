const express = require('express');
const router = express.Router();
const migrationController = require('../controllers/migrationController');

// In production, you might want to protect this with a secret key
router.get('/run', migrationController.migrate);

module.exports = router;
