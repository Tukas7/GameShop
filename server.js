const cors = require('cors');
const sql = require('mssql');
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
const app = express();
const port = process.env.PORT || 8000;
const path = require('path');
app.use(express.json()); // Для разбора JSON-форматированных тел запросов
app.use(cors()); // Для обработки CORS-запросов, если фронтенд будет на другом домене
const SECRET_KEY = '1234';
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.use(express.static(path.join(__dirname)));
const config = {
    user: 'Ilusha',
    password: 'qwerty123321F',
    server: '92.53.107.236',
    database: 'GameShop',
    
    options: {
        encrypt: true,
        trustServerCertificate: true // Игнорировать ошибки сертификата
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'vma23022@gmail.com',
        pass: 'gsetzpicdnehbmxp'
    }
});
sql.connect(config)
  .then(() => console.log('Connected to the Database!'))
  .catch(err => console.error('Could not connect to the database!', err));


  const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'img/'); // Папка для сохранения изображений
  },
  filename: function(req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Добавляем временную метку к имени файла для уникальности
  }
});

const upload = multer({ storage: storage });
// админ панель
app.post('/api/games', upload.single('imageFile'), async (req, res) => {
    const { title, description, price, genre, recommended, discounted, oldPrice, newRelease, gpu, cpu, storage, ram } = req.body;
    const imageUrl = req.file ? `/img/${req.file.filename}` : null;

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input('title', sql.VarChar, title);
        request.input('description', sql.VarChar, description);
        request.input('price', sql.Decimal, price);
        request.input('genre', sql.VarChar, genre);
        request.input('recommended', sql.Bit, recommended === '1');
        request.input('discounted', sql.Bit, discounted === '1');
        request.input('oldPrice', sql.Decimal, discounted === '1' ? oldPrice : null);
        request.input('newRelease', sql.Bit, newRelease === '1');
        request.input('imageUrl', sql.VarChar, imageUrl);
        request.input('gpu', sql.VarChar, gpu);
        request.input('cpu', sql.VarChar, cpu);
        request.input('storage', sql.VarChar, storage);
        request.input('ram', sql.VarChar, ram);

        const result = await request.query(`
            INSERT INTO Games (Title, Description, Price, Genre, Recommended, Discounted, OldPrice, NewRelease, ImageURL)
            VALUES (@title, @description, @price, @genre, @recommended, @discounted, @oldPrice, @newRelease, @imageUrl);
            SELECT SCOPE_IDENTITY() AS GameID;
        `);

        const gameId = result.recordset[0].GameID;
        await request.input('gameId', sql.Int, gameId);
        await request.query(`
            INSERT INTO SystemRequirements (GameID, GPU, CPU, Storage, RAM)
            VALUES (@gameId, @gpu, @cpu, @storage, @ram)
        `);

        res.send('Игра успешно добавлена');
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при добавлении игры');
    }
});




app.get('/api/gamesadmin', async (req, res) => {
    try {
        const { search, sort, genre, recommended, discounted, newRelease } = req.query;
        let query = "SELECT * FROM Games WHERE 1=1";
        
        if (search) {
            query += " AND Title LIKE @search";
        }
        if (genre && genre !== '') {
            query += " AND Genre = @genre";
        }
        if (recommended) {
            query += " AND Recommended = 1";
        }
        if (discounted) {
            query += " AND Discounted = 1";
        }
        if (newRelease) {
            query += " AND NewRelease = 1";
        }
        if (sort) {
            const allowedSortFields = ['Title', 'Price DESC', 'Price ASC'];
            const sortExpression = allowedSortFields.find(s => sort.includes(s));
            if (sortExpression) {
                query += ` ORDER BY ${sortExpression}`;
            } else {
                return res.status(400).send('Invalid sort parameter');
            }
        }

        const pool = await sql.connect(config);
        const request = pool.request();
        
        if (search) {
            request.input('search', sql.VarChar, `%${search}%`);
        }
        if (genre && genre !== '') {
            request.input('genre', sql.VarChar, genre);
        }

        const result = await request.query(query);
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});






app.get('/api/game/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const pool = await sql.connect(config);
        const request = new sql.Request(pool);
        request.input('gameId', sql.Int, gameId);
        const gameDetails = await request.query(`
            SELECT g.*, r.GPU, r.CPU, r.Storage, r.RAM
            FROM Games g
            LEFT JOIN SystemRequirements r ON g.GameID = r.GameID
            WHERE g.GameID = @gameId
        `);

        if (gameDetails.recordset.length === 0) {
            res.status(404).send('Game not found');
        } else {
            res.json(gameDetails.recordset[0]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving game details');
    }
});

app.put('/api/gamesupdate/:gameId', upload.single('imageFile'), async (req, res) => {
    const { gameId } = req.params;
    const { title, description, price, genre, recommended, discounted, oldPrice, newRelease, gpu, cpu, storage, ram } = req.body;
    const imageUrl = req.file ? `/img/${req.file.filename}` : null;

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input('gameId', sql.Int, gameId);
        request.input('title', sql.VarChar, title);
        request.input('description', sql.VarChar, description);
        request.input('price', sql.Decimal, price);
        request.input('genre', sql.VarChar, genre);
        request.input('recommended', sql.Bit, recommended === '1');
        request.input('discounted', sql.Bit, discounted === '1');
        request.input('oldPrice', sql.Decimal, discounted === '1' ? oldPrice : null);
        request.input('newRelease', sql.Bit, newRelease === '1');
        request.input('imageUrl', sql.VarChar, imageUrl);
        request.input('gpu', sql.VarChar, gpu);
        request.input('cpu', sql.VarChar, cpu);
        request.input('storage', sql.VarChar, storage);
        request.input('ram', sql.VarChar, ram);
        if (imageUrl){
        await request.query(`
            UPDATE Games
            SET Title = @title, Description = @description, Price = @price, Genre = @genre,
                Recommended = @recommended, Discounted = @discounted, OldPrice = @oldPrice, NewRelease = @newRelease, ImageURL = @imageUrl
            WHERE GameID = @gameId
        `);

        await request.query(`
            UPDATE SystemRequirements
            SET GPU = @gpu, CPU = @cpu, Storage = @storage, RAM = @ram
            WHERE GameID = @gameId
        `);
    }else{
        await request.query(`
            UPDATE Games
            SET Title = @title, Description = @description, Price = @price, Genre = @genre,
                Recommended = @recommended, Discounted = @discounted, OldPrice = @oldPrice, NewRelease = @newRelease
            WHERE GameID = @gameId
        `);

        await request.query(`
            UPDATE SystemRequirements
            SET GPU = @gpu, CPU = @cpu, Storage = @storage, RAM = @ram
            WHERE GameID = @gameId
        `);
    }
        res.send('Игра успешно обновлена');
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при обновлении игры');
    }
});






app.get('/api/games', async (req, res) => {
    try {
        const { search, sort, genre, recommended, discounted, newRelease } = req.query;
        let query = `
            SELECT g.*
            FROM Games g
            WHERE EXISTS (SELECT 1 FROM GameKeys k WHERE k.GameID = g.GameID)
        `;
        
        if (search) {
            query += " AND g.Title LIKE @search";
        }
        if (genre && genre !== '') {
            query += " AND g.Genre = @genre";
        }
        if (recommended) {
            query += " AND g.Recommended = 1";
        }
        if (discounted) {
            query += " AND g.Discounted = 1";
        }
        if (newRelease) {
            query += " AND g.NewRelease = 1";
        }
        if (sort) {
            const allowedSortFields = ['Title', 'Price DESC', 'Price ASC'];
            const sortExpression = allowedSortFields.find(s => sort.includes(s));
            if (sortExpression) {
                query += ` ORDER BY ${sortExpression}`;
            } else {
                return res.status(400).send('Invalid sort parameter');
            }
        }

        const pool = await sql.connect(config);
        const request = pool.request();
        
        if (search) {
            request.input('search', sql.VarChar, `%${search}%`);
        }
        if (genre && genre !== '') {
            request.input('genre', sql.VarChar, genre);
        }

        const result = await request.query(query);
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
app.put('/api/games/:gameId', upload.single('imageFile'), async (req, res) => {
    const { gameId } = req.params;
    const { title, description, price, genre, recommended, discounted, oldPrice, newRelease, gpu, cpu, storage, ram } = req.body;
    const imageUrl = req.file ? `/img/${req.file.filename}` : null;

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input('gameId', sql.Int, gameId);
        request.input('title', sql.VarChar, title);
        request.input('description', sql.VarChar, description);
        request.input('price', sql.Decimal, price);
        request.input('genre', sql.VarChar, genre);
        request.input('recommended', sql.Bit, recommended === '1');
        request.input('discounted', sql.Bit, discounted === '1');
        request.input('oldPrice', sql.Decimal, discounted === '1' ? oldPrice : null);
        request.input('newRelease', sql.Bit, newRelease === '1');
        request.input('imageUrl', sql.VarChar, imageUrl);
        request.input('gpu', sql.VarChar, gpu);
        request.input('cpu', sql.VarChar, cpu);
        request.input('storage', sql.VarChar, storage);
        request.input('ram', sql.VarChar, ram);

        await request.query(`
            UPDATE Games
            SET Title = @title, Description = @description, Price = @price, Genre = @genre,
                Recommended = @recommended, Discounted = @discounted, OldPrice = @oldPrice, NewRelease = @newRelease, ImageURL = @imageUrl
            WHERE GameID = @gameId
        `);

        await request.query(`
            UPDATE SystemRequirements
            SET GPU = @gpu, CPU = @cpu, Storage = @storage, RAM = @ram
            WHERE GameID = @gameId
        `);

        res.send('Игра успешно обновлена');
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при обновлении игры');
    }
});

app.post('/api/games/:gameId/keys', async (req, res) => {
    const { gameId } = req.params;
    const { gameKey } = req.body;

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input('gameId', sql.Int, gameId);
        request.input('gameKey', sql.VarChar, gameKey);

        await request.query(`
            INSERT INTO GameKeys (GameID, GameKey)
            VALUES (@gameId, @gameKey)
        `);

        res.send('Ключ добавлен успешно');
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при добавлении ключа');
    }
});
app.get('/api/sales/stats', async (req, res) => {
    try {
        const query = `
            SELECT g.Title, SUM(s.Quantity) AS TotalQuantity, SUM(s.Quantity * g.Price) AS TotalRevenue
            FROM Sales s
            JOIN Games g ON s.GameID = g.GameID
            GROUP BY g.Title
            ORDER BY TotalQuantity DESC
        `;

        const pool = await sql.connect(config);
        const result = await pool.request().query(query);
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при получении статистики продаж');
    }
});


app.post('/api/order', async (req, res) => {
    const { email, cart } = req.body;
    console.log(cart);

    try {
        const pool = await sql.connect(config);
        const request = pool.request();

        for (const item of cart) {
            // Добавляем запись в таблицу Sales
            await request.query(`
                INSERT INTO Sales (GameID, Quantity)
                VALUES (${item.GameID}, ${item.quantity})
            `);

            // Получаем ключи игры
            const result = await request.query(`
                SELECT TOP ${item.quantity} GameKey
                FROM GameKeys
                WHERE GameID = ${item.GameID}
            `);

            // Отправка ключей на email пользователя
            const gameKeys = result.recordset.map(record => record.GameKey).join(', ');
            const mailOptions = {
                from: 'your_email@gmail.com',
                to: email,
                subject: `Ваш заказ на ${item.title}`,
                text: `Спасибо за покупку! Вот ваш ключ(и) для игры ${item.title}: ${gameKeys}`
            };

            await transporter.sendMail(mailOptions);

            // Удаление ключей из базы данных
            await request.query(`
                DELETE FROM GameKeys
                WHERE GameKey IN (${gameKeys.split(', ').map(key => `'${key}'`).join(', ')})
            `);
        }

        res.status(200).send('Заказ успешно оформлен');
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при оформлении заказа');
    }
});

app.get('/api/keys/stats', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT g.Title, COUNT(k.GameKey) AS KeyCount
            FROM GameKeys k
            JOIN Games g ON k.GameID = g.GameID
            GROUP BY g.Title
            ORDER BY KeyCount DESC
        `);
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при получении статистики ключей');
    }
});




app.get('/api/keystats', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT g.Title, COUNT(k.GameKey) AS KeyCount
            FROM Games g
            LEFT JOIN GameKeys k ON g.GameID = k.GameID
            GROUP BY g.Title
            ORDER BY KeyCount DESC
        `);
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при получении статистики ключей');
    }
});


app.post('/api/reviews', upload.none(), async (req, res) => {
    const { gameId, username, rating, comment } = req.body;

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input('gameId', sql.Int, gameId);
        request.input('username', sql.VarChar, username);
        request.input('rating', sql.Int, rating);
        request.input('comment', sql.VarChar, comment);
        await request.query(`
            INSERT INTO Reviews (GameID, Username, Rating, Comment)
            VALUES (@gameId, @username, @rating, @comment)
        `);

        res.status(201).send('Review added successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding review');
    }
});

app.get('/api/reviews/:gameId', async (req, res) => {
    const { gameId } = req.params;

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input('gameId', sql.Int, gameId);
        const result = await request.query(`
            SELECT * FROM Reviews WHERE GameID = @gameId ORDER BY ReviewDate DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving reviews');
    }
});

app.delete('/api/reviews/:reviewId', async (req, res) => {
    const { reviewId } = req.params;

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input('reviewId', sql.Int, reviewId);
        await request.query(`
            DELETE FROM Reviews WHERE ReviewID = @reviewId
        `);

        res.status(200).send('Review deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting review');
    }
});

app.get('/api/keystats', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT g.Title, COUNT(k.GameKey) AS KeyCount
            FROM Games g
            LEFT JOIN GameKeys k ON g.GameID = k.GameID
            GROUP BY g.Title
            ORDER BY KeyCount DESC
        `);
        res.json(result.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при получении статистики ключей');
    }
});