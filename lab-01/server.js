
const express = require('express');

const app = express();

// Route 1: Home
app.get('/', (req, res) => {
    res.status(200).send('Welcome to my Express Server!');
});

// Route 2: About
app.get('/about', (req, res) => {
    res.status(200).json({
        name: 'KUNCHALA PRAVEEN KUMAR',
        section: 'CSE-GEN-AI 2B 111'
    });
});

// Route 3: Current Date and Time
app.get('/time', (req, res) => {
    const currentTime = new Date();
    res.status(200).send(currentTime.toString());
});

// Route 4: Handle Unknown Routes
app.use((req, res) => {
    res.status(404).send('404 - Page Not Found');
});

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});
