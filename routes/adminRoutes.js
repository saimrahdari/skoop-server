var express = require('express');
var router = express.Router();
var passport = require('passport');
var authenticate = require('../middleware/authAdmin');
var adminController = require('../controllers/adminController');
const admin = require('../models/admin');

router.get(
	'/dashboard',
	authenticate.verifyAdmin,
	adminController.countUsers,
	adminController.newUsers
);
router.get('/all-users', authenticate.verifyAdmin, adminController.getAllUsers);
router.get(
	'/all-restaurants',
	authenticate.verifyAdmin,
	adminController.getAllRestaurants
);
router.get(
	'/fulluserinfo/:id',
	authenticate.verifyAdmin,
	adminController.fullCustomerInformation,
	adminController.fullScooperInformation
);
router.get(
	'/pastorders/:id',
	authenticate.verifyAdmin,
	adminController.getPastOrdersCustomer
);
router.get(
	'/pastordersres/:id',
	authenticate.verifyAdmin,
	adminController.getPastOrdersRestaurant
);
router.get(
	'/singleuserdetail/:id',
	authenticate.verifyAdmin,
	adminController.getSingleCustomerDetail
);
router.get(
	'/singleresdetail/:id',
	authenticate.verifyAdmin,
	adminController.getSingleRestaurantDetail
);
router.get(
	'/reports',
	authenticate.verifyAdmin,
	adminController.getAllReportsScooperAndRestaurant
);
router.get(
	'/fullorderdetail/:id',
	authenticate.verifyAdmin,
	adminController.getFullOrderDetail
);
router.get(
	'/search',
	authenticate.verifyAdmin,
	adminController.findCustomersAndRestaurants
);
router.post('/register', adminController.register);
router.post(
	'/sign-in',
	passport.authenticate('local-admin'),
	adminController.signIn
);
router.patch(
	'/edit-user/:id',
	authenticate.verifyAdmin,
	adminController.editUser
);
router.patch(
	'/edit-res/:id',
	authenticate.verifyAdmin,
	adminController.editRestaurant
);
router.patch(
	'/withdraw/accept/:id',
	authenticate.verifyAdmin,
	adminController.withdrawAccept
);
router.delete(
	'/delete-restaurant/:id',
	authenticate.verifyAdmin,
	adminController.deleteRestaurant
);
router.delete(
	'/delete-user/:id',
	authenticate.verifyAdmin,
	adminController.deleteUser
);
router.get(
	'currentAdmin',
	authenticate.verifyAdmin,
	adminController.getAdmin
)

module.exports = router;
