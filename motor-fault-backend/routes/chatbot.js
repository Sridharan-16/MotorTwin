const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// POST endpoint for user questions
router.post('/', chatbotController.ask);

module.exports = router;
