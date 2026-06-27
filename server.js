const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vault_secret_token_key_2026_99';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('$Kool321', 10); // Passcode updated to $Kool321

// Establish Directories
const DB_DIR = path.join(__dirname, 'database');
const DB_FILE = path.join(DB_DIR, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Core JSON Flat Database Persistence
let DB_MEMORY = null;

const FACTORY_DEFAULT_REVIEWS = [
    {
        id: "mock-witcher-3-game",
        filename: "gaming_the_witcher_3_wild_hunt_review.bbcode",
        title: "The Witcher 3: Wild Hunt Review",
        category: "Gaming",
        thumbnail: "",
        content: `[b][center][size=6][color=#fbbf24]THE WITCHER 3: WILD HUNT[/color][/size]\n[size=3][i]An Open-World RPG Masterpiece[/i][/size][/center][/b]\n\n[quote]“The world is not slide-ruled into good and evil. It is an infinite web of shades of grey.” — Geralt of Rivia[/quote]\n\nReleased by CD Projekt Red, [b]The Witcher 3: Wild Hunt[/b] stands as one of the peak triumphs in gaming history. From its deep character arcs to its complex narrative branches, it sets an unparalleled standard for immersive storytelling. You take the role of Geralt of Rivia, a monster-slaying witcher seeking his adoptive daughter who is pursued by the terrifying Wild Hunt.\n\n[b][size=4][color=#3b82f6]Comprehensive RPG Evaluation Metrics[/color][/size][/b]\nBelow is an in-depth breakdown of our gameplay and production evaluation:\n\n[table]\n[tr]\n[th]Metric Evaluated[/th]\n[th]Score Indicator[/th]\n[th]Verdict Remarks[/th]\n[/tr]\n[tr]\n[td][b]Graphics & Visuals[/b][/td]\n[td][color=#34d399]9.8 / 10[/color][/td]\n[td]Breathtaking sunrises, realistic wind sway foliage, and superb character animations.[/td]\n[/tr]\n[tr]\n[td][b]Storyline & Narrative[/b][/td]\n[td][color=#34d399]10.0 / 10[/color][/td]\n[td]Incredible quest lines. Even trivial side contracts contain tragic world building.[/td]\n[/tr]\n[tr]\n[td][b]Combat Mechanics[/b][/td]\n[td][color=#fbbf24]8.5 / 10[/color][/td]\n[td]Fluid sign casting and dodging, though swordplay lock-on can occasionally feel floaty.[/td]\n[/tr]\n[tr]\n[td][b]Soundtrack & Acoustics[/b][/td]\n[td][color=#34d399]10.0 / 10[/color][/td]\n[td]Incredible Slavic folk instruments, intense battle vocals, and stellar vocal talents.[/td]\n[/tr]\n[/table]\n\n[b][size=4][color=#c084fc]Critical Strengths & Limitations[/color][/size][/b]\n[list]\n[*] [b]Pro:[/b] Unbelievably deep choices which lead to drastically different world conditions.\n[*] [b]Pro:[/b] Memorable multi-dimensional companions (Yennefer, Ciri, Triss, Bloody Baron).\n[*] [b]Con:[/b] Stash inventory menus can get slow and cluttered during long adventures.\n[*] [b]Con:[/b] Water traversal and underwater cross-bow aiming are less refined than land controls.\n[/list]\n\n[center][b][size=4]Final Universal Rating: [color=#34d399]9.6 / 10[/color][/size][/b][/center]`,
        size: 2048,
        date: "6/27/2026"
    },
    {
        id: "mock-dune-movie",
        filename: "movie_dune_part_two_epic.txt",
        title: "Dune: Part Two Movie Review",
        category: "Movies",
        thumbnail: "",
        content: `[b][center][size=6][color=#22d3ee]DUNE: PART TWO[/color][/size]\n[size=3][i]Denis Villeneuve's Definitive Sci-Fi Masterwork[/i][/size][/center][/b]\n\n[quote]“He who can destroy a thing, controls a thing.” — Paul Atreides[/quote]\n\nThe ultimate cinematic odyssey of 2024 has officially landed on the burning sands of Arrakis. [b]Dune: Part Two[/b] is not merely a high-budget sequel; it represents an epochal crowning achievement for science-fiction film-making, masterfully capturing the core philosophical warnings of Frank Herbert's timeless classic.\n\n[b][size=4][color=#22d3ee]Cinematographic & Technical Production Matrix[/color][/size][/b]\nHere is our detailed metric tracking of the blockbuster's technical delivery:\n\n[table]\n[tr]\n[th]Cinematic Category[/th]\n[th]Rating Grade[/th]\n[th]Key Highlights & Discoveries[/th]\n[/tr]\n[tr]\n[td][b]Visual Composition[/b][/td]\n[td][color=#34d399]5.0 / 5.0[/color][/td]\n[td]Greig Fraser delivers stellar framing, monolithic scale, and iconic monochromatic Harkonnen battles.[/td]\n[/tr]\n[tr]\n[td][b]Sound Design & Score[/b][/td]\n[td][color=#34d399]5.0 / 5.0[/color][/td]\n[td]Hans Zimmer's soundtrack rattles theater seats with deep industrial horns and wind beats.[/td]\n[/tr]\n[tr]\n[td][b]Acting Performances[/b][/td]\n[td][color=#34d399]4.8 / 5.0[/color][/td]\n[td]Timothée Chalamet is sensational. Austin Butler's Feyd-Rautha is a chilling, psychopathic force.[/td]\n[/tr]\n[/table]\n\n[b][size=4]Core Themes & Adaptation Fidelity[/size][/b]\nVilleneuve boldly underscores the dark aspects of Herbert's text. Instead of celebrating Paul Atreides as a common superhero, the cinema reveals the terrifying weight of religious extremism and engineered prophecy. It warns the masses of the dangers of charismatic, absolute leaders.\n\n[list]\n[*] [b]Visual Masterstroke:[/b] Watching Paul harness and ride the colossal Shai-Hulud sandworm is a theater marvel.\n[*] [b]Acoustic Immersion:[/b] Best felt in high-fidelity IMAX environments where audio vibrates directly in your chest.\n[*] [b]Pacing Mechanics:[/b] Despite spanning almost three hours, the desert intrigue keeps tension beautifully wired.\n[/list]\n\n[center][b][size=4]Sensory Cinematic Rating: [color=#34d399]A+ (9.8 / 10)[/color][/size][/b][/center]`,
        size: 2190,
        date: "6/27/2026"
    }
];

function loadDB() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const content = fs.readFileSync(DB_FILE || 'db.json', 'utf8');
            if (!content.trim()) {
                throw new Error("Empty DB file");
            }
            DB_MEMORY = JSON.parse(content);
        } catch (e) {
            console.error("Corrupted DB. Resetting schema.", e);
            resetDB();
        }
    } else {
        resetDB();
    }
}

function resetDB() {
    DB_MEMORY = {
        reviews: [...FACTORY_DEFAULT_REVIEWS],
        categories: ["Gaming", "Movies", "Books", "General"]
    };
    saveDB();
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(DB_MEMORY, null, 4), 'utf8');
}

// Load database immediately
const DB_PATH = DB_FILE;
loadDB();

// Express Middlewares Configuration
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: true }));

// Disable API Caching globally on all endpoints to guarantee changes apply instantly on refresh!
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Simple Auth middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied. Token missing." });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Access denied. Invalid session token." });
        next();
    });
};

// Authentication routes
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password field is required." });
    if (bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, success: true });
    }
    return res.status(401).json({ error: "Invalid Admin Passcode." });
});

app.get('/api/auth/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.json({ authenticated: false });
    jwt.verify(token, JWT_SECRET, (err) => {
        if (err) return res.json({ authenticated: false });
        return res.json({ authenticated: true });
    });
});

// Configure Multer Storage for local product thumbnails uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExt = path.extname(file.originalname).toLowerCase();
        cb(null, 'thumbnail-' + uniqueSuffix + fileExt);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB maximum size
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: Multipart attachments must be valid graphics files!"));
    }
});

// Upload Product Thumbnail endpoint (Admin Authorized)
app.post('/api/upload', authMiddleware, upload.single('thumbnail'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Please select an image file to upload." });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({ url: fileUrl });
});

// Reviews Retrieval and CRUD API Handlers (CORS compliant)
app.get('/api/reviews', (req, res) => {
    return res.json(DB_MEMORY.reviews);
});

app.post('/api/reviews', authMiddleware, (req, res) => {
    const { title, category, filename, content, thumbnail } = req.body;
    if (!title) return res.status(400).json({ error: "Review title is required." });

    let finalFilename = filename ? filename.trim() : title.trim().toLowerCase().replace(/\s+/g, "_") + ".bbcode";
    if (!finalFilename.endsWith(".txt") && !finalFilename.endsWith(".bbcode")) {
        finalFilename += ".bbcode";
    }

    const newReview = {
        id: "writeup-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
        filename: finalFilename,
        title: title.trim(),
        category: category || "General",
        content: content || "",
        thumbnail: thumbnail || "",
        size: (content || "").length,
        date: new Date().toLocaleDateString()
    };

    DB_MEMORY.reviews.unshift(newReview);
    saveDB();
    return res.json(newReview);
});

app.put('/api/reviews/:id', authMiddleware, (req, res) => {
    const { title, category, filename, content, thumbnail } = req.body;
    const reviewId = req.params.id;

    const idx = DB_MEMORY.reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) return res.status(404).json({ error: "Writeup not found." });

    let finalFilename = filename ? filename.trim() : title.trim().toLowerCase().replace(/\s+/g, "_") + ".bbcode";
    if (!finalFilename.endsWith(".txt") && !finalFilename.endsWith(".bbcode")) {
        finalFilename += ".bbcode";
    }

    DB_MEMORY.reviews[idx].title = title.trim();
    DB_MEMORY.reviews[idx].category = category || "General";
    DB_MEMORY.reviews[idx].filename = finalFilename;
    DB_MEMORY.reviews[idx].content = content || "";
    DB_MEMORY.reviews[idx].thumbnail = thumbnail || "";
    DB_MEMORY.reviews[idx].size = (content || "").length;

    saveDB();
    return res.json(DB_MEMORY.reviews[idx]);
});

app.delete('/api/reviews/:id', authMiddleware, (req, res) => {
    const reviewId = req.params.id;

    const idx = DB_MEMORY.reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) return res.status(404).json({ error: "Writeup not found." });

    const deletedItem = DB_MEMORY.reviews.splice(idx, 1)[0];
    saveDB();
    return res.json(deletedItem);
});

// Categories Management API routes (Admin Authorized)
app.get('/api/categories', (req, res) => {
    return res.json(DB_MEMORY.categories);
});

app.post('/api/categories', authMiddleware, (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Category name is required." });
    
    const label = name.trim();
    if (DB_MEMORY.categories.map(c => c.toLowerCase()).includes(label.toLowerCase())) {
        return res.status(400).json({ error: "Category already exists." });
    }

    DB_MEMORY.categories.push(label);
    saveDB();
    return res.json(DB_MEMORY.categories);
});

app.put('/api/categories/rename', authMiddleware, (req, res) => {
    const { oldName, newName } = req.body;
    if (!oldName || !newName || !newName.trim()) {
        return res.status(400).json({ error: "Old name and new name are required." });
    }

    const nName = newName.trim();
    const idx = DB_MEMORY.categories.indexOf(oldName);
    if (idx === -1) return res.status(404).json({ error: "Category not found." });

    if (DB_MEMORY.categories.map(c => c.toLowerCase()).includes(nName.toLowerCase()) && nName.toLowerCase() !== oldName.toLowerCase()) {
        return res.status(400).json({ error: "That category name already exists." });
    }

    // Rename
    DB_MEMORY.categories[idx] = nName;

    // Relink mapped reviews
    DB_MEMORY.reviews.forEach(rev => {
        if (rev.category === oldName) rev.category = nName;
    });

    saveDB();
    return res.json({ categories: DB_MEMORY.categories, reviews: DB_MEMORY.reviews });
});

app.delete('/api/categories/:name', authMiddleware, (req, res) => {
    const catName = req.params.name;
    const idx = DB_MEMORY.categories.indexOf(catName);
    if (idx === -1) return res.status(404).json({ error: "Category not found." });

    if (DB_MEMORY.categories.length <= 1) {
        return res.status(400).json({ error: "Error: At least one category must exist." });
    }

    // Remove category
    DB_MEMORY.categories.splice(idx, 1);
    const defaultCategory = DB_MEMORY.categories[0] || "General";

    // Remap matching posts
    DB_MEMORY.reviews.forEach(rev => {
        if (rev.category === catName) rev.category = defaultCategory;
    });

    saveDB();
    return res.json({ categories: DB_MEMORY.categories, reviews: DB_MEMORY.reviews });
});

// Serve frontend router wildcards fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Launch Server
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🔥 Review Portfolio Vault server is running on http://localhost:${PORT}`);
    console.log(`🔑 Admin Passcode: $Kool321`);
    console.log(`📁 Local database path: ${DB_FILE}`);
    console.log(`===============================================`);
});
