var mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
	try {
		const { connection } = await mongoose.connect(process.env.MONGODB_URL, {
			useNewUrlParser: true,
		});
		console.log(`Connected with database ${connection.host} 💚 .`);
	} catch (error) {
		console.log(error);
	}
};

module.exports = { connectDB };
