var authenticate = require('../middleware/auth');
var asyncHandler = require('../middleware/asyncHandler');
var ErrorHandler = require('../utils/error');

var Customer = require('../models/customers');
var Restaurant = require('../models/restaurants');
var Otp = require('../models/otp');
var DeliveryAddress = require('../models/delivery_addresses');
var FoodCategory = require('../models/food_categories');
var Order = require('../models/orders');
var FoodItem = require('../models/food_items');

exports.getPastRides = asyncHandler(async (req, res, next) => {
	const pastRides = await Order.find({
		skooper: req.user._id,
		status: 3,
	})
		.populate('customer')
		.limit(3);
	res.status(200).json({ pastRides });
});
