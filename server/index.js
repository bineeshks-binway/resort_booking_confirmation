const express = require('express'); // restart trigger
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const pdfRoutes = require('./routes/pdfController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Middleware
app.use(cors({
    origin: '*', // Allow all origins for production stability
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Booking-Id']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
const connectDB = require('./config/db');
connectDB();

// Static files (for images served in PDF)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', pdfRoutes);

app.get('/', (req, res) => {
    res.send('Wayanad Resort PDF Server is Running');
});

// ROOT LEVEL DEBUG ROUTE (Bypasses /api prefix issues)
app.get('/debug-env', (req, res) => {
    // Check credentials safely
    const email = process.env.RESORT_EMAIL || "";
    const apiKey = process.env.BREVO_API_KEY || "";

    res.json({
        message: "Server is reachable",
        debug: {
            email_configured: !!email,
            email_length: email.length,
            brevo_key_configured: !!apiKey,
            brevo_key_length: apiKey.length,
            brevo_key_prefix: apiKey ? apiKey.substring(0, 5) + "..." : null
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});