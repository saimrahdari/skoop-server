var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FoodCategory = new Schema({
	title: { type: String, default: '' },
	description: { type: String, default: '' },
	image: { type: String, default: null },
	restaurant: { type: mongoose.Types.ObjectId, ref: 'Restaurant' },
});

module.exports = mongoose.model('FoodCategory', FoodCategory);
