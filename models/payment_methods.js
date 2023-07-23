var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Payment_Method = new Schema({
	card_title: {
		type: String,
	},
	card_number: { type: Number },
	cvc: { type: Number },
	expiry_date: {
		type: Date,
	},
	user: {
		type: mongoose.Types.ObjectId,
		ref: 'Customer',
	},
});

module.exports = mongoose.model('Payment_Method', Payment_Method);
