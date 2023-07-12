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
	'/getrestaurantdetails/:id',
	authenticate.verifyCustomer,
	customerController.getRestaurantWithCategoryItems
);
router.get(
	'/get-orders',
	authenticate.verifyCustomer,
	customerController.getOrders
);
router.get(
	'/get-order/:id',
	authenticate.verifyCustomer,
	customerController.getSingleOrder
);
router.get(
	'/active-orders',
	authenticate.verifyCustomer,
	customerController.getActiveOrder
);
router.get(
	'/get-reviews/:id',
	authenticate.verifyCustomer,
	customerController.getReviews
);
router.get(
	'/get-fooditems',
	authenticate.verifyCustomer,
	customerController.getFoodItems
);
router.get(
	'/get-singlefooditem/:id',
	authenticate.verifyCustomer,
	customerController.getSingleFoodItem
);
router.get(
	'/past-orders',
	authenticate.verifyCustomer,
	customerController.getPastOrder
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
	'/view-favouriterestaurants',
	authenticate.verifyCustomer,
	customerController.getFavouriteRestaurant
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
router.post(
	'/create-order',
	authenticate.verifyCustomer,
	customerController.createOrder
);
router.post(
	'/add-deliveryaddress',
	authenticate.verifyCustomer,
	customerController.addAddress
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
router.patch(
	'/set-favourite/:id',
	authenticate.verifyCustomer,
	customerController.setFavouriteRestaurant
);
router.patch(
	'/remove-favourite/:id',
	authenticate.verifyCustomer,
	customerController.removeFavouriteRestaurant
);
router.patch(
	'/cancel-order/:id',
	authenticate.verifyCustomer,
	customerController.cancelOrder
);

module.exports = router;
