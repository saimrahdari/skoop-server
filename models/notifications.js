var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationCustomer = new Schema(
	{
		user: {
			type: mongoose.Types.ObjectId,
			ref: 'Customer',
		},
		message: {
			type: 'String',
		},
		read: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('NotificationCustomer', NotificationCustomer);
