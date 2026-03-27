const express = require('express');
const cors = require('cors');
const app = express();

const path = require('path');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const migrationRoutes = require('./routes/migrationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/migrate', migrationRoutes);

app.get('/api', (req, res) => {
    res.json({ message: "JMart API is Live", version: "1.0.0" });
});

// Serve frontend static files from the root dist folder
app.use(express.static(path.join(__dirname, '../../dist')));

// Handle React Router SPA routing (catch-all)
app.get('(.*)', (req, res) => {
    // If it's an API request that wasn't caught, return 404
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: "API Endpoint Not Found" });
    }
    // Otherwise serve index.html
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

module.exports = app;
