const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const ReportSchema = new Schema(
	{
		customer: {
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
		type: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Report', ReportSchema);
