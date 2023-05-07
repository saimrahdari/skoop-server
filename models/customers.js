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
		type: 'String',
		default: '',
	},
});

Customer.plugin(passportLocalMongoose, {
	usernameField: 'email',
});

module.exports = mongoose.model('Customer', Customer);
