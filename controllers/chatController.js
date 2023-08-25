var Conversation = require('../models/conversation');
var Customer = require('../models/customers');
var Message = require('../models/messages');
var asyncHandler = require('../middleware/asyncHandler');

exports.createConversation = asyncHandler(async (req, res) => {
	const newConversation = new Conversation({
		members: [req.user._id, req.body.receiverId],
	});
	const savedConversation = await newConversation.save();
	res.status(200).json(savedConversation);
});

exports.getConversations = asyncHandler(async (req, res) => {
	const conversation = await Conversation.find({
		members: { $in: [req.user._id] },
	}).populate('members');
	res.status(200).json(conversation);
});

exports.saveMessage = asyncHandler(async (req, res) => {
	const newMessage = new Message({
		conversationId: req.body.conversationId,
		sender: req.user._id,
		text: req.body.text,
	});
	const savedMessage = await newMessage.save();
	res.status(200).json(savedMessage);
});

exports.getMessages = asyncHandler(async (req, res) => {
	const messages = await Message.find({
		conversationId: req.params.id,
	});
	res.status(200).json(messages);
});

exports.findCustomers = asyncHandler(async (req, res) => {
	const query = req.query.name;
	var customers = await Customer.find({
		full_name: { $regex: new RegExp(query, 'i') },
	});
	res.status(200).json(customers);
});
