var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FoodCategory = new Schema({
	title: { type: String, default: '' },
	descroption: { type: String, default: '' },
	image: { type: String, default: null },
	restuarant: { type: mongoose.Types.ObjectId, ref: 'Restaurant' },
});

module.exports = mongoose.model('FoodCategory', FoodCategory);
