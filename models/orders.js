var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Order = new Schema({
	restaurant: { type: mongoose.Types.ObjectId, ref: 'Restaurant' },
	scooper: { type: mongoose.Types.ObjectId, ref: 'Customer' },
	customer: { type: mongoose.Types.ObjectId, ref: 'Customer' },
	address: { type: mongoose.Types.ObjectId, ref: 'DeliveryAddress' },
	amount: { type: Number, default: 0 },
	status: { type: Number, default: 0 },
	delivery_charges: { type: Number, default: 0 },
	type: { type: String, default: 0 },
	tip: { type: Number, default: 0 },
	payment_method: { type: String },
	special_instructions: [String],
});

module.exports = mongoose.model('Order', Order);
