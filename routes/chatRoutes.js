var express = require('express');
var router = express.Router();
var authenticate = require('../middleware/auth');
var chatController = require('../controllers/chatController');

router.get(
	'/findusers',
	authenticate.verifyCustomer,
	chatController.findCustomers
);
router.get(
	'/getconversations',
	authenticate.verifyCustomer,
	chatController.getConversations
);
router.get(
	'/getmessages/:id',
	authenticate.verifyCustomer,
	chatController.getMessages
);
router.post(
	'/createconversation',
	authenticate.verifyCustomer,
	chatController.createConversation
);
router.post(
	'/savemessage',
	authenticate.verifyCustomer,
	chatController.saveMessage
);

module.exports = router;
