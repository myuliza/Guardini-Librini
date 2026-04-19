const express = require('express');
const app = express();
const path = require('path');

// 1. Middlewares (Esencial para que el servidor entienda datos)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Importar las rutas de los libros
const bookRoutes = require('./routes/books'); 

// 3. CONECTAR LAS RUTAS AL SERVIDOR
app.use('/api', bookRoutes); 

// 4. Servir los archivos estáticos de la carpeta views
app.use(express.static(path.join(__dirname, 'views')));

// --- RUTAS PARA NAVEGAR ENTRE PÁGINAS ---

// Página de inicio (Buscador)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Página de la Biblioteca
app.get('/library', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'library.html'));
});

// ESTA ES LA QUE TE FALTABA: Página de Detalle
app.get('/books/detail', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'detail.html'));
});

// ----------------------------------------

app.listen(3000, () => {
    console.log('📚 Servidor listo en http://localhost:3000');
});