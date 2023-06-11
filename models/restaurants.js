var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var Restaurant = new Schema({
	restaurant_name: {
		type: String,
		default: '',
	},
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
	food_categories: [String],
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
				time: {
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
	cover_photo: { type: String, default: '' },
	open: { type: Boolean, default: false },
	latitude: { type: String, default: '' },
	longitude: { type: String, default: '' },
	orders: { type: Number, default: 0 },
	sales: { type: Number, default: 0 },
	plan: { type: String, default: '' },
	plan_ending_date: { type: Date, default: null },
	reviews: { type: Array, default: [] },
});

Restaurant.plugin(passportLocalMongoose, {
	usernameField: 'email',
});

module.exports = mongoose.model('Restaurant', Restaurant);
