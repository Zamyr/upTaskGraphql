const mongoose = require('mongoose');
require('dotenv').config({path: 'variables.env'});

const conectarDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true,
		});
		console.log('DB Conectada');
	} catch (error) {
		console.log('Hubo un error');
		console.log(error);
		//Detener la app en caso de un error
		process.exit(1);
	}
};

module.exports = conectarDB;
