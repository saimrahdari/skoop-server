var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var Admin = new Schema({
	email: { type: String, default: '' },
	wallet: { type: Number, default: 0 },
});

Admin.plugin(passportLocalMongoose, {
	usernameField: 'email',
});

module.exports = mongoose.model('Admin', Admin);
