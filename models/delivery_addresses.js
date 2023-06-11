var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DeliveryAddress = new Schema({
	location_name: {
		type: String,
	},
	latitude: { type: String },
	longitude: { type: String },
	custom_name: { type: String },
	customer: { type: mongoose.Types.ObjectId, ref: 'Customer' },
});

module.exports = mongoose.model('DeliveryAddress', DeliveryAddress);
