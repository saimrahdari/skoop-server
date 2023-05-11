var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DeliveryAddress = new Schema({
	location_name: {
		type: 'String',
	},
	latitude: { type: String },
	longitude: { type: String },
});

module.exports = mongoose.model('DeliveryAddress', DeliveryAddress);
