var express = require('express');
var router = express.Router();
var passport = require('passport');
var authenticate = require('../middleware/auth');
var customerController = require('../controllers/customerController');

// ? Customer Routes //
router.get('/otp/:email', customerController.getOtp);
router.get('/otpVerify/:email/:otp', customerController.verifyOtp);
router.get(
	'/view-deliveryaddress',
	authenticate.verifyCustomer,
	customerController.getAddress
);
router.get(
	'/customer',
	authenticate.verifyCustomer,
	customerController.getCustomer
);
router.get(
	'/view-featuredrestaurants',
	authenticate.verifyCustomer,
	customerController.getRestaurants
);
router.get(
	'/view-pizzaburgerrestaurants',
	authenticate.verifyCustomer,
	customerController.getPizzaBurgerRestaurant
);
router.post('/register', customerController.register);
router.post(
	'/sign-in',
	passport.authenticate('local'),
	customerController.signIn
);
router.put(
	'/add-review',
	authenticate.verifyCustomer,
	customerController.addReview
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
	customerController.passwordChange
);
router.patch(
	'/change-role',
	authenticate.verifyCustomer,
	customerController.switchRoles
);
router.post(
	'/add-deliveryaddress',
	authenticate.verifyCustomer,
	customerController.addAddress
);

module.exports = router;
