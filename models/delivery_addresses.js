var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Delivery_Address = new Schema({
	location_name: {
		type: 'String',
	},
	latitude: { type: String },
	longitude: { type: String },
});

module.exports = mongoose.model('Delivery_Addresses', Delivery_Address);
