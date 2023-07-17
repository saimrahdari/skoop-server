const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const ConversationSchema = new Schema(
	{
		members: [{ type: mongoose.Types.ObjectId, ref: 'Customer' }],
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Conversation', ConversationSchema);
