const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db/database');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_KEY = 'AIzaSyDLkN-QW06lIZqFae8pGbXqQ-6jy14fR4w';

// GET /api/search - Buscar en Google
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        // CORRECCIÓN: Solo UNA declaración de 'url'
        // Dejamos la de US para ver si trae más precios de Harry Potter
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&country=US&key=${API_KEY}`;
        
        const response = await axios.get(url);
        const items = response.data.items || [];

        const results = items.map(item => {
            const saleInfo = item.saleInfo;
            let priceLabel = "Precio no disponible";
            if (saleInfo && saleInfo.listPrice) {
                priceLabel = `${saleInfo.listPrice.amount} ${saleInfo.listPrice.currencyCode}`;
            }

            return {
                googleBooksId: item.id,
                title: item.volumeInfo.title,
                author: item.volumeInfo.authors ? item.volumeInfo.authors[0] : 'Autor desconocido',
                thumbnail: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : null,
                description: item.volumeInfo.description || 'Sin descripción',
                price: priceLabel,
                pageCount: item.volumeInfo.pageCount || 0, 
                publisher: item.volumeInfo.publisher || 'N/A',
                publishedDate: item.volumeInfo.publishedDate || 'N/A',
                categories: item.volumeInfo.categories ? item.volumeInfo.categories.join(', ') : 'General',
                
            };
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Error en la búsqueda" });
    }
});



// GET /api/books - Listar biblioteca
// POST /api/books - Agregar libro
router.post('/books', (req, res) => {
    const b = req.body;
    
    // Solo UNA declaración de sql
    const sql = `INSERT INTO books (title, author, thumbnail, description, publisher, published_date, page_count, google_books_id, price, categories) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    // Solo UNA declaración de params
    const params = [
        b.title, 
        b.author, 
        b.thumbnail, 
        b.description, 
        b.publisher, 
        b.publishedDate, 
        b.pageCount, 
        b.google_books_id || b.googleBooksId, 
        b.price,
        b.categories // <--- El décimo parámetro
    ];

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Error DB:", err.message);
            if (err.message.includes('UNIQUE')) return res.status(409).json({ error: "Este libro ya está en tu biblioteca" });
            return res.status(500).json({ error: "Error al guardar en base de datos" });
        }
        res.json({ id: this.lastID, ...b });
    });
});

// GET /api/books - LISTAR LOS LIBROS DE LA BIBLIOTECA
router.get('/books', (req, res) => {
    const { search, sort, tag } = req.query;
    
    // Consulta base
    let query = "SELECT * FROM books WHERE 1=1";
    let filterParams = [];

    // Filtro por nombre o autor
    if (search) {
        query += " AND (title LIKE ? OR author LIKE ?)";
        filterParams.push(`%${search}%`, `%${search}%`);
    }

    // Filtro por Tema (categorías)
    if (tag) {
        query += " AND categories LIKE ?";
        filterParams.push(`%${tag}%`);
    }

    // Ordenamiento
    const sorts = {
        title_asc: "ORDER BY title ASC",
        title_desc: "ORDER BY title DESC",
        date_asc: "ORDER BY added_at ASC",
        date_desc: "ORDER BY added_at DESC"
    };
    query += ` ${sorts[sort] || "ORDER BY added_at DESC"}`;

    db.all(query, filterParams, (err, rows) => {
        if (err) {
            console.error("Error al leer DB:", err.message);
            return res.status(500).json({ error: "No se pudieron cargar los libros" });
        }
        // Enviamos la lista (aunque esté vacía enviamos [])
        res.json(rows || []);
    });
});

// GET /api/books/:id - VER DETALLE DE UN LIBRO
router.get('/books/:id', (req, res) => {
    db.get('SELECT * FROM books WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Libro no encontrado" });
        res.json(row);
    });
});

// DELETE /api/books/:id - ELIMINAR LIBRO
router.delete('/books/:id', (req, res) => {
    db.run('DELETE FROM books WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "No se pudo eliminar" });
        res.json({ success: true });
    });
});

module.exports = router;
