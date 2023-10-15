var passport = require('passport');
var nodemailer = require('nodemailer');
var authenticate = require('../middleware/authAdmin');
var asyncHandler = require('../middleware/asyncHandler');
var ErrorHandler = require('../utils/error');

var Customer = require('../models/customers');
var Admin = require('../models/admin');
var Order = require('../models/orders');
var Restaurant = require('../models/restaurants');
var Otp = require('../models/otp');
var FoodItem = require('../models/food_items');
var Report = require('../models/reports');

exports.register = async (req, res, next) => {
	var exists = await Admin.findOne({ email: req.body.email });
	if (exists) {
		next(new ErrorHandler('Email already associated with an account', 409));
	} else {
		try {
			const admin = await Admin.registe(
				new Admin({
					email: req.body.email,
				}),
				req.body.password
			);
			if (admin) {
				try {
					await admin.save();
					passport.authenticate('local-admin')(req, res, () => {
						res.status(201).json({
							success: true,
							status: 'Registration Successful!',
						});
					});
				} catch (error) {
					return next(error);
				}
			}
		} catch (error) {
			return next(error);
		}
	}
};

exports.getAdmin = asyncHandler(async (req, res) => {
	res.json({ customer: req.user });
});

exports.signIn = asyncHandler(async (req, res) => {
	let token = authenticate.getToken({ _id: req.user._id });
	res.status(200).json({
		success: true,
		token: token,
		admin: req.user,
	});
});

exports.getOtp = asyncHandler(async (req, res, next) => {
	var exists = await Admin.findOne({ email: req.params.email });
	if (!exists) {
		next(new ErrorHandler('Email does not exist', 404));
	} else {
		var existing = await Otp.find({ email: req.params.email });
		if (existing.length > 0) {
			await Otp.deleteOne({ email: req.params.email });
		}
		var a = Math.floor(1000 + Math.random() * 9000).toString();
		var code = a.substring(-2);
		await Otp.create({ token: code, email: req.params.email });
		let transport = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				user: process.env.EMAIL,
				pass: process.env.EMAIL_PASSWORD,
			},
		});
		const mailOptions = {
			from: process.env.EMAIL,
			to: req.params.email,
			subject: 'OTP Verification',
			text: `Your four-digit verification code is: ${code}`,
		};
		transport.sendMail(mailOptions, function (err, info) {
			if (err) {
				next(new ErrorHandler('Internal Server Error', 500));
			} else {
				res.status(200).json();
			}
		});
	}
});

exports.verifyOtp = asyncHandler(async (req, res, next) => {
	let otp = req.params.otp;
	let email = req.params.email;
	let doc = await Otp.findOne({ email: email });
	if (otp === doc.token) {
		await Otp.deleteOne({ email: email });
		res.status(200).json();
	} else {
		res.status(404).json({ message: 'Invalid or Expired token' });
	}
});

exports.passwordReset = asyncHandler(async (req, res, next) => {
	let admin = await Admin.findOne({ email: req.body.email });
	let newAdmin = await admin.setPassword(req.body.password);
	newAdmin.save();
	res.status(201).json({ message: 'Successfully changed password.' });
});

exports.countUsers = asyncHandler(async (req, res, next) => {
	req.totalUsers = await Customer.countDocuments();
	next();
});

exports.newUsers = asyncHandler(async (req, res, next) => {
	req.newUsers = await Customer.find().sort({ _id: -1 }).limit(4);
	res.status(200).json({
		totalUsers: req.totalUsers,
		newUsers: req.newUsers,
	});
});

exports.getAllUsers = asyncHandler(async (req, res, next) => {
	const totalUsers = await Customer.countDocuments();
	const page = parseInt(req.query.page) || 1;
	const perPage = 20;
	const totalItems = await Customer.countDocuments();
	const totalPages = Math.ceil(totalItems / perPage);
	const allUsers = await Customer.find({})
		.skip((page - 1) * perPage)
		.limit(perPage);

	var finalData = [];
	for (let i = 0; i < allUsers.length; i++) {
		var spentAmount = await Order.aggregate([
			{ $match: { customer: allUsers[i]._id, status: 3 } },
			{
				$group: {
					_id: 'none',
					totalAmount: { $sum: '$total' },
					rating: { $avg: '$scooperReview.rating' },
				},
			},
		]);
		var obj = {
			user: allUsers[i],
			totalSpent: spentAmount.length > 0 ? spentAmount[0].totalAmount : 0,
			rating: spentAmount.length > 0 ? spentAmount[0].rating : 5,
		};
		finalData.push(obj);
	}
	res.status(200).json({
		users: finalData,
		totalItems: totalItems,
		currentPage: page,
		perPage: perPage,
		totalPages: totalPages,
		totalUsers,
	});
});

exports.getAllRestaurants = asyncHandler(async (req, res, next) => {
	var totalRes = await Restaurant.countDocuments();
	const page = parseInt(req.query.page) || 1;
	const perPage = 20;
	const totalItems = await Restaurant.countDocuments();
	const totalPages = Math.ceil(totalItems / perPage);
	const allRestaurants = await Restaurant.find({})
		.skip((page - 1) * perPage)
		.limit(perPage);

	var finalData = [];
	for (let i = 0; i < allRestaurants.length; i++) {
		const foodItems = await FoodItem.find({
			restaurant: [allRestaurants[i]._id],
		});
		var ids = [];
		var totalEarning = 0;
		for (let i = 0; i < foodItems.length; i++) {
			ids.push(foodItems[i]._id);
		}
		const earnings = await Order.aggregate([
			{ $unwind: '$foodItems' },
			{
				$match: {
					'foodItems.item': { $in: ids },
				},
			},
			{ $project: { foodItems: 1 } },
		]);
		for (let i = 0; i < earnings.length; i++) {
			const elem = await FoodItem.findById(earnings[i].foodItems.item);
			let cal = 0;
			if (earnings[i].foodItems.quantity) {
				cal = elem.price * earnings[i].foodItems.quantity;
			} else {
				cal = elem.price;
			}
			totalEarning += cal;
		}
		var ratings = await Restaurant.aggregate([
			{ $match: { _id: allRestaurants[i]._id } },
			{
				$unwind: '$reviews',
			},
			{
				$group: {
					_id: '$_id',
					rating: { $avg: '$reviews.stars' },
				},
			},
		]);
		var obj = {
			restaurant: allRestaurants[i],
			rating: ratings.length > 0 ? ratings[0].rating : 5.0,
			earnings: totalEarning,
		};
		finalData.push(obj);
	}
	res.status(200).json({
		restaurants: finalData,
		totalItems: totalItems,
		currentPage: page,
		perPage: perPage,
		totalPages: totalPages,
		totalRes,
	});
});

exports.deleteRestaurant = asyncHandler(async (req, res, next) => {
	const deleteRes = await Restaurant.findByIdAndDelete(req.params.id);
	if (deleteRes) {
		return res
			.status(200)
			.json({ message: 'Restaurant deleted successfully' });
	} else {
		next(new ErrorHandler('No such restaurant exists', 404));
	}
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
	const deleteUser = await Customer.findByIdAndDelete(req.params.id);
	if (deleteUser) {
		return res
			.status(200)
			.json({ message: 'Customer deleted successfully' });
	} else {
		next(new ErrorHandler('No such customer exists', 404));
	}
});

exports.editUser = asyncHandler(async (req, res, next) => {
	var currentUser = await Customer.findById(req.params.id);
	if (currentUser.email !== req.body.email) {
		var exists = await Customer.findOne({
			email: req.body.email,
		});
		if (exists) {
			return res
				.status(409)
				.json({ message: 'Email already associated with a user.' });
		}
	}
	if (currentUser.student_id !== req.body.student_id) {
		var exists = await Customer.findOne({
			student_id: req.body.student_id,
		});
		if (exists) {
			return res.status(409).json({
				message: 'Student-Id already associated with a user.',
			});
		}
	}
	let update = {
		student_id: req.body.student_id,
		email: req.body.email,
		full_name: req.body.full_name,
		picture: req.body.picture,
	};
	await Customer.findByIdAndUpdate(req.params.id, update);
	res.status(204).json({});
});

exports.editRestaurant = asyncHandler(async (req, res, next) => {
	var currentUser = await Restaurant.findById(req.params.id);
	let update = {
		restaurant_name: req.body.restaurant_name,
		email: req.body.email,
		phone_number: req.body.phone_number,
		category: req.body.category,
		description: req.body.description,
		address: req.body.address,
		picture: req.body.picture,
	};
	if (currentUser.email !== req.body.email) {
		var exists = await Restaurant.findOne({
			email: req.body.email,
		});
		if (exists) {
			return res.status(409).json({
				message: 'Email already associated with a restaurant.',
			});
		}
	}
	await Restaurant.findByIdAndUpdate(req.user._id, update);
	res.status(204).json();
});

exports.fullCustomerInformation = asyncHandler(async (req, res, next) => {
	req.user = await Customer.findById(req.params.id);
	var customerInformation = await Order.aggregate([
		{ $match: { customer: req.user._id, status: 3 } },
		{
			$group: {
				_id: 'none',
				totalAmount: { $sum: '$total' },
				totalOrders: { $sum: 1 },
			},
		},
	]);
	if (customerInformation.length > 0) {
		req.userInfo = {
			totalAmount: customerInformation[0].totalAmount,
			totalOrders: customerInformation[0].totalOrders,
		};
	} else {
		req.userInfo = {
			totalAmount: 0,
			totalOrders: 0,
		};
	}
	next();
});

exports.fullScooperInformation = asyncHandler(async (req, res, next) => {
	var skooperInformation = await Order.aggregate([
		{ $match: { scooper: req.user._id, status: 3 } },
		{
			$group: {
				_id: 'none',
				totalCharges: { $sum: '$delivery_charges' },
				totalOrders: { $sum: 1 },
			},
		},
	]);
	if (skooperInformation.length > 0) {
		req.skooperInfo = {
			totalEarned: skooperInformation[0].totalCharges,
			totalOrders: skooperInformation[0].totalOrders,
		};
	} else {
		req.skooperInfo = {
			totalEarned: 0,
			totalOrders: 0,
		};
	}
	res.status(200).json({
		userInformation: req.userInfo,
		skooperInformation: req.skooperInfo,
	});
});

exports.getPastOrdersCustomer = asyncHandler(async (req, res, next) => {
	if (req.query.role === 'customer') {
		const data = await Order.find({
			customer: req.params.id,
			status: 3,
		}).populate('foodItems ');
		res.status(200).json(data);
	} else {
		const data = await Order.find({
			scooper: req.params.id,
			status: 3,
		}).populate('foodItems.item scooperReview.reviewer');
		res.status(200).json(data);
	}
});

exports.getPastOrdersRestaurant = asyncHandler(async (req, res, next) => {
	const foodItems = await FoodItem.find({
		restaurant: req.params.id,
	});
	var ids = [];
	for (let i = 0; i < foodItems.length; i++) {
		ids.push(foodItems[i]._id);
	}
	const data = await Order.find({
		foodItems: { $in: ids },
		status: 3,
	}).populate('foodItems');
	res.status(200).json(data);
});

exports.getFullOrderDetail = asyncHandler(async (req, res, next) => {
	const order = await Order.findById(req.params.id)
		.populate('customer')
		.populate('scooper')
		.populate('address')
		.populate('foodItems.item');
	res.status(200).json({ order });
});

exports.getSingleCustomerDetail = asyncHandler(async (req, res, next) => {
	const customer = await Customer.findById(req.params.id);
	const review = await Order.find({ scooper: req.params.id }).select(
		'scooperReview'
	);
	res.status(200).json({ review, customer });
});

exports.getSingleRestaurantDetail = asyncHandler(async (req, res, next) => {
	const restaurant = await Restaurant.findById(req.params.id);
	const foodItems = await FoodItem.find({
		restaurant: req.params.id,
	});

	var ids = [];
	var totalEarning = 0;
	for (let i = 0; i < foodItems.length; i++) {
		ids.push(foodItems[i]._id);
	}

	const earnings = await Order.aggregate([
		{ $unwind: '$foodItems' },
		{
			$match: {
				'foodItems.item': { $in: ids },
				status: 3,
			},
		},
		{ $project: { foodItems: 1 } },
	]);

	for (let i = 0; i < earnings.length; i++) {
		const elem = await FoodItem.findById(earnings[i].foodItems.item);
		let cal = 0;
		if (earnings[i].foodItems.quantity) {
			cal = elem.price * earnings[i].foodItems.quantity;
		} else {
			cal = elem.price;
		}
		totalEarning += cal;
	}

	var ratings = await Restaurant.aggregate([
		{ $match: { _id: req.params.id } },
		{
			$unwind: '$reviews',
		},
		{
			$group: {
				_id: '$_id', 
				rating: { $avg: '$reviews.stars' },
			},
		},
	]);

	var data = {
		restaurant: restaurant,
		rating: ratings.length > 0 ? ratings[0].rating : 5.0,
		earnings: totalEarning,
	};
	res.status(200).json({
		data: data,
	});
});

exports.findCustomersAndRestaurants = asyncHandler(async (req, res) => {
	const query = req.query.name;
	var customers = await Customer.find({
		full_name: { $regex: new RegExp(query, 'i') },
	});
	var rest = await Restaurant.find({
		restaurant_name: { $regex: new RegExp(query, 'i') },
	});
	var data = [...customers, rest];
	res.status(200).json(data);
});

exports.getAllReportsScooperAndRestaurant = asyncHandler(
	async (req, res, next) => {
		if (req.query.type === 'true') {
			const totalReports = await Report.find({ type: false });
			const page = parseInt(req.query.page) || 1;
			const perPage = 20;
			const totalItems = totalReports.length;
			const totalPages = Math.ceil(totalItems / perPage);
			const allReports = await Report.find({ type: false })
				.skip((page - 1) * perPage)
				.limit(perPage)
				.populate('customer')
				.populate('scooper');

			res.status(200).json({
				reports: allReports,
				totalItems: totalItems,
				currentPage: page,
				perPage: perPage,
				totalPages: totalPages,
			});
		} else {
			const totalReports = await Report.find({ type: true });
			const page = parseInt(req.query.page) || 1;
			const perPage = 20;
			const totalItems = totalReports.length;
			const totalPages = Math.ceil(totalItems / perPage);
			const allReports = await Report.find({ type: true })
				.skip((page - 1) * perPage)
				.limit(perPage)
				.populate('customer restaurant');

			res.status(200).json({
				reports: allReports,
				totalItems: totalItems,
				currentPage: page,
				perPage: perPage,
				totalPages: totalPages,
			});
		}
	}
);

exports.withdrawAccept = asyncHandler(async (req, res, next) => {
	let { amount, customer } = req.body;
	if (customer) {
		await Customer.findByIdAndUpdate(req.params.id, {
			$inc: { balance: -amount },
		});
	} else {
		await Restaurant.findByIdAndUpdate(req.params.id, {
			$inc: { balance: -amount },
		});
	}
	res.status(200).json({ message: 'Amount transferred.' });
});
