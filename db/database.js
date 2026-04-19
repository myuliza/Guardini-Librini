const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'books.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error abriendo DB:", err.message);
    else console.log("✅ Base de datos conectada.");
});

db.serialize(() => {
    // Borramos la tabla vieja para que no haya conflictos (Solo por esta vez)
    // db.run("DROP TABLE IF EXISTS books"); 

    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        thumbnail TEXT,
        description TEXT,
        publisher TEXT,
        published_date TEXT,
        page_count INTEGER,
        google_books_id TEXT UNIQUE,
        price TEXT,
        categories TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error("Error creando tabla:", err.message);
        else console.log("✅ Tabla 'books' lista.");
    });
});

module.exports = db;
