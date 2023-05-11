var express = require('express');
var router = express.Router();
var passport = require('passport');
var authenticate = require('../middleware/auth');
var customerController = require('../controllers/customerController');

// ? Customer Routes //
router.get('/otp/:email', customerController.getOtp);
router.get('/otpVerify/:email/:otp', customerController.verifyOtp);
router.get(
	'/customer',
	authenticate.verifyCustomer,
	customerController.getCustomer
);
router.post('/register', customerController.register);
router.post(
	'/sign-in',
	passport.authenticate('local'),
	customerController.signIn
);
router.patch('/reset-password', customerController.passwordReset);
router.patch(
	'/edit-customer',
	authenticate.verifyCustomer,
	customerController.editCustomer
);
router.patch(
	'/change-password',
	passport.authenticate('local'),
	customerController.passwordReset
);
router.patch(
	'/change-role',
	authenticate.verifyCustomer,
	customerController.switchRoles
);

module.exports = router;
