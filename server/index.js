const express = require('express');
const cors = require('cors');
const path = require('path');
const pdfRoutes = require('./routes/pdfController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for images served in PDF)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', pdfRoutes);

app.get('/', (req, res) => {
    res.send('Wayanad Resort PDF Server is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
