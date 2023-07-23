var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationCustomer = new Schema(
	{
		user: {
			type: mongoose.Types.ObjectId,
			ref: 'Customer',
		},
		scooper: {
			type: mongoose.Types.ObjectId,
			ref: 'Customer',
		},
		restaurant: {
			type: mongoose.Types.ObjectId,
			ref: 'Restaurant',
		},
		message: {
			type: String,
		},
		read: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('NotificationCustomer', NotificationCustomer);
