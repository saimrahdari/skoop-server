var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FoodItem = new Schema({
	name: { type: String, defualt: '' },
	price: { type: Number },
	ingredient: { type: String, defualt: '' },
	description: { type: String, defualt: '' },
	food_category: {
		type: mongoose.Types.ObjectId,
		ref: 'FoodCategory',
	},
	image: { type: String },
	restaurant: { type: mongoose.Types.ObjectId, ref: 'Restaurant' },
});

module.exports = mongoose.model('FoodItem', FoodItem);
