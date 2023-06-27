var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var Customer = new Schema({
	student_id: {
		type: String,
		default: '',
	},
	role: {
		type: String,
		default: 'customer',
	},
	email: { type: String, default: '' },
	phone_number: {
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
	full_name: { type: String },
	picture: { type: String, default: '' },
	tips: { type: Number, default: 0 },
	rides: { type: Number, default: 0 },
	rating: { type: Number, default: 0 },
	reviews: { type: Number, default: 0 },
	latitude: { type: 'String', default: '' },
	longitude: { type: 'String', default: '' },
	favourite: {
		type: [
			{
				rid: {
					type: mongoose.Types.ObjectId,
					ref: 'Restaurant',
				},
			},
		],
	},
});

Customer.plugin(passportLocalMongoose, {
	usernameField: 'email',
});

module.exports = mongoose.model('Customer', Customer);
