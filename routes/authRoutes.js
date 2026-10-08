const express = require('express');
const router = express.Router();
const { signup, login, logout, getMe } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getMe);

module.exports = router;
