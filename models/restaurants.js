var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var Restaurant = new Schema(
	{
		restaurant_name: {
			type: String,
			default: '',
		},
		cancelled: { type: Number, default: 0 },
		email: { type: String, default: '' },
		phone_number: {
			type: String,
			default: '',
		},
		description: {
			type: String,
			default: '',
		},
		balance: {
			type: Number,
			default: 0,
		},
		fcm: {
			type: String,
			default: '',
		},
		opening_hours: {
			type: [
				{
					day: {
						type: String,
					},
					timeStart: {
						type: String,
					},
					timeEnd: {
						type: String,
					},
					availability: {
						type: Boolean,
						default: false,
					},
				},
			],
		},
		address: { type: String, default: '' },
		picture: { type: String, default: '' },
		open: { type: Boolean, default: false },
		latitude: { type: Number },
		longitude: { type: Number },
		orders: { type: Number, default: 0 },
		reviews: {
			type: [
				{
					customer: {
						type: mongoose.Types.ObjectId,
						ref: 'Customer',
					},
					message: { type: String },
					stars: { type: Number },
					orderID: {
						type: mongoose.Types.ObjectId,
						ref: 'Order',
					},
				},
			],
		},
	},
	{ timestamps: true }
);

Restaurant.plugin(passportLocalMongoose, {
	usernameField: 'email',
});

module.exports = mongoose.model('Restaurant', Restaurant);
