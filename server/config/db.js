const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://wayanad_fort_user:ZRkxnEiwfMc*KP2@cluster0.jsprjwf.mongodb.net/wayanad_fort_collection?retryWrites=true&w=majority&appName=Cluster0');

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`🗄️  Connected to Database: "${conn.connection.name}"`); // Log DB Name
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

module.exports = connectDB;
