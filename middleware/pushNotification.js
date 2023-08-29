var FCM = require('fcm-node');
var serverKey = process.env.FCM_KEY;
var fcm = new FCM(serverKey);

exports.sendPushNotification = async (ids, message) => {
	try {
		var message = {
			to: [ids],
			collapse_key: '',

			notification: {
				title: title,
				body: message,
			},

			data: {
				my_key: 'my value',
				my_another_key: 'my another value',
			},
		};

		var pushMessage = {
			registration_ids: ids,
			content_available: true,
			mutable_content: true,
			notification: {
				body: message,
				icon: 'myicon', //Default Icon
				sound: 'mySound', //Default sound
			},
		};

		fcm.send(pushMessage, (err, response) => {
			if (err) {
				console.log('Something has gone wrong!', err);
			} else {
				console.log('Successfully sent with response: ', response);
			}
		});
	} catch (error) {
		console.log('Error is:', error);
	}
};
