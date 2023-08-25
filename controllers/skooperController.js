var asyncHandler = require('../middleware/asyncHandler');

var Customer = require('../models/customers');
var Order = require('../models/orders');
var FoodItem = require('../models/food_items');
var Restaurant = require('../models/restaurants');
var Conversation = require('../models/conversation');
var Admin = require('../models/admin');

//? Utility Functions
const degreesToRadians = degrees => {
	return degrees * (Math.PI / 180);
};

const calculateDistance = (lat1, lat2, lon1, lon2) => {
	const earthRadius = 6371;
	const lat1Rad = degreesToRadians(lat1);
	const lon1Rad = degreesToRadians(lon1);
	const lat2Rad = degreesToRadians(lat2);
	const lon2Rad = degreesToRadians(lon2);
	const dLat = lat2Rad - lat1Rad;
	const dLon = lon2Rad - lon1Rad;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1Rad) *
			Math.cos(lat2Rad) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = earthRadius * c;
	return distance;
};
//? End

exports.getPastRides = asyncHandler(async (req, res, next) => {
	const pastRides = await Order.find({
		scooper: req.user._id,
		status: 3,
	})
		.populate('customer')
		.limit(3);
	res.status(200).json({ pastRides });
});

exports.getRequests = asyncHandler(async (req, res, next) => {
	const getRequests = await Order.find({
		customer: { $ne: req.user._id },
		status: 0,
	})
		.populate('address')
		.populate({
			path: 'foodItems.item',
			populate: {
				path: 'restaurant',
				model: 'Restaurant',
			},
		});

	var finalRequests = [];
	for (let i = 0; i < getRequests.length; i++) {
		const point1 = { lat: req.user.latitude, lon: req.user.longitude };
		const point2 = {
			lat: getRequests[i].address.latitude,
			lon: getRequests[i].address.longitude,
		};
		const distanceKm = calculateDistance(
			point1.lat,
			point2.lat,
			point1.lon,
			point2.lon
		);
		if (distanceKm < 10000) {
			finalRequests.push(getRequests[i]);
		}
	}
	res.status(200).json({ finalRequests });
});

exports.getCurrentAcceptedRequests = asyncHandler(async (req, res, next) => {
	const acceptedRequests = await Order.find({
		scooper: req.user._id,
		$or: [{ status: 1 }, { status: 2 }],
	})
		.populate('address')
		.populate({
			path: 'foodItems.item',
			populate: {
				path: 'restaurant',
				model: 'Restaurant',
			},
		});
	res.status(200).json({ acceptedRequests });
});

exports.acceptRequest = asyncHandler(async (req, res, next) => {
	const order = await Order.findById(req.params.id).populate('address');
	const point1 = { lat: req.user.latitude, lon: req.user.longitude };
	const point2 = {
		lat: order.address.latitude,
		lon: order.address.longitude,
	};
	const distanceKm = calculateDistance(
		point1.lat,
		point2.lat,
		point1.lon,
		point2.lon
	);
	var remainingTime = Math.ceil(
		(distanceKm * 1000) / (req.user.speed * 16.667)
	);
	remainingTime = `${remainingTime} minutes`;
	const newConversation = new Conversation({
		members: [req.user._id, order.customer],
	});
	await Order.findByIdAndUpdate(req.params.id, {
		scooper: req.user._id,
		$inc: { status: 1 },
		remainingTime,
	});
	await newConversation.save();
	res.status(200).json({ message: 'Ride accepted' });
});

exports.pickedFood = asyncHandler(async (req, res, next) => {
	await Order.findByIdAndUpdate(req.params.id, {
		$inc: { status: 1 },
		restaurantTime: Date.now(),
	});
	res.status(200).json({ message: 'Order Picked Up.' });
});

exports.cancelRide = asyncHandler(async (req, res, next) => {
	var order = await Order.findById(req.params.id);
	await Customer.findByIdAndUpdate(order.scooper, {
		$inc: { cancelled_rides: 1 },
	});
	await Order.findByIdAndUpdate(req.params.id, {
		status: 0,
		restaurantTime: null,
		scooper: '',
	});
	res.status(200).json({ message: 'Ride cancelled.' });
});

exports.getLocationofRestaurant = asyncHandler(async (req, res, next) => {
	const location = await FoodItem.findById(req.params.id).populate(
		'restaurant'
	);
	res.status(200).json({
		location: {
			latitude: location.restaurant.latitude,
			longitude: location.restaurant.longitude,
		},
	});
});

exports.getLocationofCustomer = asyncHandler(async (req, res, next) => {
	const location = await Order.findById(req.params.id).populate('address');
	res.status(200).json({
		location: {
			latitude: location.address.latitude,
			longitude: location.address.longitude,
		},
	});
});

exports.completeOrder = asyncHandler(async (req, res, next) => {
	const order = await Order.findById(req.params.id);
	await Order.findByIdAndUpdate(req.params.id, {
		$inc: { status: 1 },
		completeTime: Date.now(),
		remainingTime: 'None',
	});
	await Admin.findOneAndUpdate(
		{ email: 'admin@gmail.com' },
		{
			$inc: { wallet: -order.total },
		}
	);
	let totalDeliveryCharges = order.delivery_charges + order.tip;
	await Customer.findByIdAndUpdate(req.user._id, {
		$inc: { tips: order.tip, rides: 1, balance: totalDeliveryCharges },
	});
	for (let i = 0; i < order.foodItems.length; i++) {
		const rest = await FoodItem.findById(order.foodItems[i].item).populate(
			'restaurant'
		);
		await Restaurant.findByIdAndUpdate(rest.restaurant._id, {
			$inc: { orders: 1, balance: order.foodItems[i].price },
		});
	}
	res.status(200).json({ message: 'Order completed' });
});

exports.scooperRidesMonthly = asyncHandler(async (req, res, next) => {
	var gte = null;
	var lte = null;
	if (req.query.nature === 'weekly') {
		lte = new Date();
		gte = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
	} else if (req.query.nature === 'monthly') {
		gte = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		lte = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
	} else {
		lte = new Date();
		gte = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
	}

	const result = await Order.aggregate([
		{
			$match: {
				scooper: req.user._id,
				createdAt: {
					$gte: gte,
					$lte: lte,
				},
			},
		},
		{
			$group: {
				_id: null,
				tips: { $sum: '$tip' },
				totalRides: {
					$sum: 1,
				},
				avgRating: { $avg: '$scooperReview.rating' },
				deliveryCharges: { $sum: '$delivery_charges' },
			},
		},
		{
			$project: {
				_id: 0,
				tips: 1,
				totalRides: 1,
				avgRating: { $round: ['$avgRating', 2] },
				deliveryCharges: 1,
			},
		},
	]);
	res.status(200).json(result);
});
