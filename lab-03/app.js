
const express = require('express');
const initializeDB = require('./db');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

let db;

// GET /books - Search, sorting, pagination and price filtering
app.get('/books', async (request, response) => {
    const {
        search_q = '',
        order_by = 'id',
        order = 'ASC',
        limit = '10',
        offset = '0',
        min_price,
        max_price
    } = request.query;

    // Validate sorting column
    const allowedColumns = ['id', 'title', 'author', 'price', 'pages'];

    if (!allowedColumns.includes(order_by)) {
        return response.status(400).json({
            message: 'Invalid order_by column'
        });
    }

    // Validate sorting order
    if (
        typeof order !== 'string' ||
        !['ASC', 'DESC'].includes(order.toUpperCase())
    ) {
        return response.status(400).json({
            message: 'Order must be ASC or DESC'
        });
    }

    // Validate limit and offset
    const numericLimit = Number(limit);
    const numericOffset = Number(offset);

    if (
        !/^\d+$/.test(String(limit)) ||
        !/^\d+$/.test(String(offset)) ||
        !Number.isSafeInteger(numericLimit) ||
        numericLimit <= 0 ||
        !Number.isSafeInteger(numericOffset) ||
        numericOffset < 0
    ) {
        return response.status(400).json({
            message: 'Limit must be a positive integer and offset must be a non-negative integer'
        });
    }

    // Validate price parameters
    if (
        (min_price !== undefined &&
            (min_price === '' || !Number.isFinite(Number(min_price)))) ||
        (max_price !== undefined &&
            (max_price === '' || !Number.isFinite(Number(max_price))))
    ) {
        return response.status(400).json({
            message: 'Prices must be numeric'
        });
    }

    if (
        min_price !== undefined &&
        max_price !== undefined &&
        Number(min_price) > Number(max_price)
    ) {
        return response.status(400).json({
            message: 'Minimum price cannot exceed maximum price'
        });
    }

    const conditions = [];
    const params = [];

    // Partial title search
    if (search_q) {
        conditions.push('title LIKE ?');
        params.push(`%${search_q}%`);
    }

    // Minimum price filter
    if (min_price !== undefined) {
        conditions.push('price >= ?');
        params.push(Number(min_price));
    }

    // Maximum price filter
    if (max_price !== undefined) {
        conditions.push('price <= ?');
        params.push(Number(max_price));
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const query = `
        SELECT * FROM book
        ${whereClause}
        ORDER BY ${order_by} ${order.toUpperCase()}
        LIMIT ? OFFSET ?
    `;

    params.push(numericLimit, numericOffset);

    const books = await db.all(query, params);

    response.status(200).json(books);
});

// GET /books/:bookId - Get a book by ID
app.get('/books/:bookId', async (request, response) => {
    const { bookId } = request.params;

    const book = await db.get(
        'SELECT * FROM book WHERE id = ?',
        [bookId]
    );

    if (book === undefined) {
        return response.status(404).json({
            message: 'Book not found'
        });
    }

    response.status(200).json(book);
});

// POST /books - Add a new book
app.post('/books', async (request, response) => {
    const { title, author, price, pages } = request.body;

    if (
        typeof title !== 'string' ||
        title.trim() === '' ||
        typeof author !== 'string' ||
        author.trim() === '' ||
        price === undefined ||
        price === null ||
        price === '' ||
        !Number.isFinite(Number(price))
    ) {
        return response.status(400).json({
            message: 'Title, author and a numeric price are required'
        });
    }

    if (
        pages !== undefined &&
        (pages === null || pages === '' || !Number.isFinite(Number(pages)))
    ) {
        return response.status(400).json({
            message: 'Pages must be numeric'
        });
    }

    const query = `
        INSERT INTO book (title, author, price, pages)
        VALUES (?, ?, ?, ?)
    `;

    const result = await db.run(query, [
        title.trim(),
        author.trim(),
        Number(price),
        pages === undefined ? null : Number(pages)
    ]);

    response.status(201).json({
        message: 'Book added successfully',
        bookId: result.lastID
    });
});

// PUT /books/:bookId - Update a book
app.put('/books/:bookId', async (request, response) => {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body;

    if (
        typeof title !== 'string' ||
        title.trim() === '' ||
        typeof author !== 'string' ||
        author.trim() === '' ||
        price === undefined ||
        price === null ||
        price === '' ||
        !Number.isFinite(Number(price))
    ) {
        return response.status(400).json({
            message: 'Title, author and a numeric price are required'
        });
    }

    if (
        pages !== undefined &&
        (pages === null || pages === '' || !Number.isFinite(Number(pages)))
    ) {
        return response.status(400).json({
            message: 'Pages must be numeric'
        });
    }

    const existingBook = await db.get(
        'SELECT * FROM book WHERE id = ?',
        [bookId]
    );

    if (existingBook === undefined) {
        return response.status(404).json({
            message: 'Book not found'
        });
    }

    await db.run(
        `UPDATE book
         SET title = ?, author = ?, price = ?, pages = ?
         WHERE id = ?`,
        [
            title.trim(),
            author.trim(),
            Number(price),
            pages === undefined ? null : Number(pages),
            bookId
        ]
    );

    response.status(200).json({
        message: 'Book updated successfully'
    });
});

// DELETE /books/:bookId - Delete a book
app.delete('/books/:bookId', async (request, response) => {
    const { bookId } = request.params;

    const existingBook = await db.get(
        'SELECT * FROM book WHERE id = ?',
        [bookId]
    );

    if (existingBook === undefined) {
        return response.status(404).json({
            message: 'Book not found'
        });
    }

    await db.run(
        'DELETE FROM book WHERE id = ?',
        [bookId]
    );

    response.status(200).json({
        message: 'Book deleted successfully'
    });
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
