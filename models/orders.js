var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Order = new Schema(
	{
		scooper: { type: mongoose.Types.ObjectId, ref: 'Customer' },
		customer: { type: mongoose.Types.ObjectId, ref: 'Customer' },
		address: { type: mongoose.Types.ObjectId, ref: 'DeliveryAddress' },
		card: { type: mongoose.Types.ObjectId, ref: 'Payment_Method' },
		status: { type: Number, default: 0 },
		delivery_charges: { type: Number, default: 0 },
		type: { type: String },
		tip: { type: Number, default: 0 },
		payment_method: { type: String },
		special_instructions: { type: String },
		foodItems: {
			type: [
				{
					item: {
						type: mongoose.Types.ObjectId,
						ref: 'FoodItem',
					},
					quantity: {
						type: Number,
					},
				},
			],
		},
		tax: { type: Number },
		total: { type: Number },
		subtotal: { type: Number },
		cancelReason: { type: String, default: null },
		scooperReview: {
			reviewer: { type: mongoose.Types.ObjectId, ref: 'Customer' },
			rating: { type: Number, default: 0 },
			message: { type: String, default: '' },
		},
		restaurantTime: { type: Date, default: null },
		completeTime: { type: Date, default: null },
		remainingTime: { type: 'String', default: '' },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Order', Order);
