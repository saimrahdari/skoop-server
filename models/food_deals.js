var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FoodDeals = new Schema(
	{
		title: { type: String, defualt: '' },
		price: { type: Number },
		description: { type: String, defualt: '' },
		images: [String],
		food_items: {
			type: [
				{
					item: {
						type: mongoose.Types.ObjectId,
						ref: 'FoodItem',
					},
				},
			],
		},
		starting_time: { type: String, default: null },
		ending_time: { type: String, default: null },
		restaurant: { type: mongoose.Types.ObjectId, ref: 'Restaurant' },
		date: { type: Date, default: null },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('FoodDeals', FoodDeals);
