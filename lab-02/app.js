
const express = require('express');
const initializeDB = require('./db');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

let db;

// GET: Retrieve all books
app.get('/books/', async (request, response) => {
    const books = await db.all('SELECT * FROM book');
    response.status(200).send(books);
});

// GET: Retrieve a book by ID
app.get('/books/:bookId/', async (request, response) => {
    const { bookId } = request.params;

    const book = await db.get(
        'SELECT * FROM book WHERE id = ?',
        [bookId]
    );

    if (book === undefined) {
        response.status(404).send('Book not found');
    } else {
        response.status(200).send(book);
    }
});

// POST: Add a new book
app.post('/books/', async (request, response) => {
    const { title, author, price, pages } = request.body;

    const query = `
        INSERT INTO book (title, author, price, pages)
        VALUES (?, ?, ?, ?)
    `;

    const result = await db.run(query, [
        title,
        author,
        price,
        pages
    ]);

    response.status(201).send({
        message: 'Book added successfully',
        bookId: result.lastID
    });
});


// PUT: Update a book
app.put('/books/:bookId/', async (request, response) => {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body;

    const existingBook = await db.get(
        'SELECT * FROM book WHERE id = ?',
        [bookId]
    );

    if (existingBook === undefined) {
        response.status(404).send('Book not found');
        return;
    }

    await db.run(
        `UPDATE book
         SET title = ?, author = ?, price = ?, pages = ?
         WHERE id = ?`,
        [title, author, price, pages, bookId]
    );

    response.status(200).send('Book updated successfully');
});


// DELETE: Delete a book
app.delete('/books/:bookId/', async (request, response) => {
    const { bookId } = request.params;

    const existingBook = await db.get(
        'SELECT * FROM book WHERE id = ?',
        [bookId]
    );

    if (existingBook === undefined) {
        response.status(404).send('Book not found');
        return;
    }

    await db.run(
        'DELETE FROM book WHERE id = ?',
        [bookId]
    );

    response.status(200).send('Book deleted successfully');
});


// Initialize database and start server
const initializeDBAndServer = async () => {
    try {
        db = await initializeDB();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error(`Database Error: ${error.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();
