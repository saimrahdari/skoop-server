const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const MessageSchema = new Schema(
	{
		conversationId: {
			type: mongoose.Types.ObjectId,
			ref: 'Conversation',
		},
		sender: {
			type: mongoose.Types.ObjectId,
			red: 'Customer',
		},
		text: {
			type: String,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);
