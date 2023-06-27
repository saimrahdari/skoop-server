var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Order = new Schema(
	{
		restaurant: { type: mongoose.Types.ObjectId, ref: 'Restaurant' },
		scooper: { type: mongoose.Types.ObjectId, ref: 'Customer' },
		customer: { type: mongoose.Types.ObjectId, ref: 'Customer' },
		address: { type: mongoose.Types.ObjectId, ref: 'DeliveryAddress' },
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
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Order', Order);
