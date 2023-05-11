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
		starting_date: { type: Date, default: Date.now },
		ending_date: { type: Date, default: null },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('FoodDeals', FoodDeals);
