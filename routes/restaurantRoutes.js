var express = require('express');
var router = express.Router();
var passport = require('passport');
var authenticate = require('../middleware/authRes');
var restaurantController = require('../controllers/restaurantController');

router.get('/otp/:email', restaurantController.getOtp);
router.get('/otpVerify/:email/:otp', restaurantController.verifyOtp);
router.get(
	'/restaurant',
	authenticate.verifyRestaurant,
	restaurantController.getRestaurant
);
router.post('/register', restaurantController.register);
router.post(
	'/sign-in',
	passport.authenticate('local'),
	restaurantController.signIn
);
router.patch('/reset-password', restaurantController.passwordReset);
router.patch(
	'/change-password',
	passport.authenticate('local'),
	restaurantController.passwordReset
);
module.exports = router;
