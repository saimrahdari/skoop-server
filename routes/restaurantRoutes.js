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
router.get(
	'/get-ordersbystatus/:status',
	authenticate.verifyRestaurant,
	restaurantController.getOrdersByStatus
);
router.get(
	'/viewfoodcategory',
	authenticate.verifyRestaurant,
	restaurantController.viewFoodCategory
);
router.get(
	'/viewfooditems',
	authenticate.verifyRestaurant,
	restaurantController.viewFoodItems
);
router.get(
	'/single-fooddeal/:id',
	authenticate.verifyRestaurant,
	restaurantController.getSingleDeal
);
router.get(
	'/all-fooddeals',
	authenticate.verifyRestaurant,
	restaurantController.getAllDeals
);
router.get(
	'/restaurant',
	authenticate.verifyRestaurant,
	restaurantController.getRestaurant
);
router.post('/register', restaurantController.register);
router.post(
	'/sign-in',
	passport.authenticate('local-res'),
	restaurantController.signIn
);
router.post(
	'/add-category',
	authenticate.verifyRestaurant,
	restaurantController.addCategory
);
router.post(
	'/add-fooditem',
	authenticate.verifyRestaurant,
	restaurantController.addFoodItem
);
router.post(
	'/add-fooddeal',
	authenticate.verifyRestaurant,
	restaurantController.addFoodDeal
);
router.patch('/reset-password', restaurantController.passwordReset);
router.patch(
	'/change-password',
	passport.authenticate('local-res'),
	restaurantController.passwordChange
);
router.patch(
	'/edit-foodcategory/:id',
	authenticate.verifyRestaurant,
	restaurantController.editFoodCategory
);
router.patch(
	'/edit-fooditem/:id',
	authenticate.verifyRestaurant,
	restaurantController.editFoodItem
);
router.patch(
	'/edit-fooddeal/:id',
	authenticate.verifyRestaurant,
	restaurantController.editFoodDeal
);
router.delete(
	'/delete-foodcategory/:fid',
	authenticate.verifyRestaurant,
	restaurantController.deleteCategory
);
router.delete(
	'/delete-fooditem/:fid',
	authenticate.verifyRestaurant,
	restaurantController.deleteFoodItem
);
router.delete(
	'/delete-fooddeal/:id',
	authenticate.verifyRestaurant,
	restaurantController.deleteFoodDeal
);
module.exports = router;
