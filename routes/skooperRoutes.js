var express = require('express');
var router = express.Router();
var passport = require('passport');
var authenticate = require('../middleware/auth');
var skooperController = require('../controllers/skooperController');

// ? Skooper Routes //
router.get(
	'/data',
	authenticate.verifyCustomer,
	skooperController.scooperRidesMonthly
);
router.get(
	'/pastrides',
	authenticate.verifyCustomer,
	skooperController.getPastRides
);
router.get(
	'/locationrestaurant/:id',
	authenticate.verifyCustomer,
	skooperController.getLocationofRestaurant
);
router.get(
	'/locationcustomer/:id',
	authenticate.verifyCustomer,
	skooperController.getLocationofCustomer
);
router.get(
	'/getrequests',
	authenticate.verifyCustomer,
	skooperController.getRequests
);
router.get(
	'/currentacceptedrequests',
	authenticate.verifyCustomer,
	skooperController.getCurrentAcceptedRequests
);
router.patch(
	'/acceptrequest/:id',
	authenticate.verifyCustomer,
	skooperController.acceptRequest
);
router.patch(
	'/pickedfood/:id',
	authenticate.verifyCustomer,
	skooperController.pickedFood
);
router.patch(
	'/cancelride/:id',
	authenticate.verifyCustomer,
	skooperController.cancelRide
);
router.patch(
	'/completeorder/:id',
	authenticate.verifyCustomer,
	skooperController.completeOrder
);

module.exports = router;
