const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bineeshbineesh518_db_user:8bKwIOtHY0Qzqefa@cluster0.fjqoqa8.mongodb.net/wayanad_fort_resort?retryWrites=true&w=majority&appName=Cluster0');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`🗄️  Connected to Database: "${conn.connection.name}"`); // Log DB Name
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
