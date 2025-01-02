const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.urlencoded({ extended: true }));

// Secret codes and their permissions
const secretCodes = {
    '00': { allowedCategories: ['FavoriteBooks', 'BooksIHave', 'OtherBooks'], restricted: false }, // See everything, including upload
    '11': { allowedCategories: ['FavoriteBooks', 'BooksIHave'], restricted: true }, // See specific categories only
};

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.body.category;
        const uploadPath = path.join(__dirname, 'uploads', category);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve static files
app.use(express.static('public'));

// Validate secret code endpoint
app.get('/validate-code/:code', (req, res) => {
    const code = req.params.code;
    if (secretCodes[code]) {
        res.json({ valid: true, ...secretCodes[code] });
    } else {
        res.json({ valid: false });
    }
});

// Fetch categories and their files
app.get('/categories', (req, res) => {
    const categoriesDir = path.join(__dirname, 'uploads');
    const categories = {};

    fs.readdir(categoriesDir, (err, folders) => {
        if (err) {
            return res.status(500).send('Error reading categories');
        }

        folders.forEach(folder => {
            const folderPath = path.join(categoriesDir, folder);
            if (fs.lstatSync(folderPath).isDirectory()) {
                categories[folder] = fs.readdirSync(folderPath); // List files in the folder
            }
        });

        res.json(categories); // Return categories and files as JSON
    });
});

// Upload endpoint
app.post('/upload', upload.single('pdfFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    res.redirect('/');
});

// Download endpoint
app.get('/download/:category/:filename', (req, res) => {
    const file = path.join(__dirname, 'uploads', req.params.category, req.params.filename);
    res.download(file);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
