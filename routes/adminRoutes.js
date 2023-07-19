var express = require('express');
var router = express.Router();
var passport = require('passport');
var authenticate = require('../middleware/authAdmin');
var adminController = require('../controllers/adminController');

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

module.exports = router;
