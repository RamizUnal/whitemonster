const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const db = require('./models/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Create songs directory if it doesn't exist
const songsDir = path.join(__dirname, 'songs');
if (!fs.existsSync(songsDir)) {
    fs.mkdirSync(songsDir);
}

// Middleware
app.use(cors());
app.use('/uploads', express.static(uploadsDir));
app.use('/songs', express.static(songsDir));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../build')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads/'))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage });

// Endpoint to get list of images
app.get('/images', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir);
        
        // Filter valid image files first
        const validImages = files.filter(file => 
            file.match(/\.(jpg|jpeg|png|gif)$/i) && 
            fs.statSync(path.join(uploadsDir, file)).isFile()
        );

        // Map with correct indexing based on actual number of valid images
        const images = validImages.map((file, index) => ({
            id: validImages.length - index,
            filename: file
        }))
        .sort((a, b) => b.id - a.id);

        console.log('Sending images:', images); // Debug log
        res.json(images);
    } catch (err) {
        console.error('Error reading uploads directory:', err);
        res.status(500).json({ error: 'Error reading uploads directory' });
    }
});

// Endpoint to get list of songs
app.get('/songlist', (req, res) => {
    fs.readdir(songsDir, (err, files) => {
        if (err) {
            console.error('Error reading songs directory:', err);
            return res.status(500).json({ error: 'Error reading songs directory' });
        }
        const songs = files.filter(file => file.endsWith('.mp3'));
        res.json(songs);
    });
});

// Handle file upload
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded successfully' });
});

// Add these new endpoints
app.post('/like/:imageId', (req, res) => {
    const imageId = req.params.imageId;
    const userIp = req.ip;

    db.run(
        'INSERT OR IGNORE INTO likes (image_id, user_ip) VALUES (?, ?)',
        [imageId, userIp],
        function(err) {
            if (err) {
                console.error('Error adding like:', err);
                return res.status(500).json({ error: 'Failed to add like' });
            }
            res.json({ success: true, changes: this.changes });
        }
    );
});

app.get('/likes/:imageId', (req, res) => {
    const imageId = req.params.imageId;
    
    db.get(
        'SELECT COUNT(*) as count FROM likes WHERE image_id = ?',
        [imageId],
        (err, row) => {
            if (err) {
                console.error('Error getting likes:', err);
                return res.status(500).json({ error: 'Failed to get likes' });
            }
            res.json({ likes: row.count });
        }
    );
});

app.get('/hasliked/:imageId', (req, res) => {
    const imageId = req.params.imageId;
    const userIp = req.ip;
    
    db.get(
        'SELECT id FROM likes WHERE image_id = ? AND user_ip = ?',
        [imageId, userIp],
        (err, row) => {
            if (err) {
                console.error('Error checking like:', err);
                return res.status(500).json({ error: 'Failed to check like' });
            }
            res.json({ hasLiked: !!row });
        }
    );
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Serving images from: ${uploadsDir}`);
    console.log(`Serving songs from: ${songsDir}`);
});