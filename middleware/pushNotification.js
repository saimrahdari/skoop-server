var FCM = require('fcm-node');
var serverKey = 'AAAAhQa92wU:APA91bFWOcrx7O6ylobwkOqkxe7MOLKYWYRtAZyeSu7toJGB8gq3Hanx3fJLtYCBnzTpUgrgONwnDm_qsZ10AUoogm2SIk_CP9FDuxurbGs17XnpC4wdVRhe6vocW7V4UH-Bz-eulZ39';
var fcm = new FCM(serverKey);

exports.sendPushNotification = async (ids, message) => {
	try {
		var pushMessage = {
			registration_ids: ids,
			content_available: true,
			mutable_content: true,
			notification: {
				title: 'Order Update',
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
