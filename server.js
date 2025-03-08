const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'saivenkat', // Replace with your MySQL password
    database: 'online_store'
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mutyalasai7@gmail.com', // Your Gmail address
        pass: 'njtv hhqu oqbr zmkw' // Your Gmail App Password
    }
});

// JWT Secret Key
const SECRET_KEY = 'keykey'; // Replace with a secure key

// Generate Reset Token
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

// Verify Token Middleware
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.userId = decoded.id; // Attach user ID to the request
        next();
    });
};

// Register User
app.post('/api/register', (req, res) => {
    const { username, password, email } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Registration failed' });

        const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
        db.query(sql, [username, hash, email], (err, result) => {
            if (err) return res.status(500).json({ error: 'Registration failed' });

            // Send Verification Email
            const verificationToken = generateResetToken();
            const mailOptions = {
                from: 'mutyalasai7@gmail.com',
                to: email,
                subject: 'Email Verification',
                text: `Click the link to verify your email: http://localhost:3000/verify-email?token=${verificationToken}`
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Error sending email:', err);
                    return res.status(500).json({ error: 'Failed to send verification email', details: err.message });
                }
                console.log('Email sent:', info.response);
                res.json({ message: 'Registration successful. Please check your email for verification.' });
            });
        });
    });
});

// Verify Email
app.get('/api/verify-email', (req, res) => {
    const { token } = req.query;
    const sql = 'UPDATE users SET email_verified = TRUE WHERE email = ?';
    db.query(sql, [token], (err, result) => {
        if (err) return res.status(500).json({ error: 'Verification failed' });
        res.json({ message: 'Email verified successfully' });
    });
});

// Login User
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Login failed' });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Login failed' });
            if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ message: 'Login successful', token });
        });
    });
});

// Request Password Reset
app.post('/api/request-password-reset', (req, res) => {
    const { email } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = results[0];
        const token = generateResetToken();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        const insertSql = 'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
        db.query(insertSql, [user.id, token, expiresAt], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to generate reset token', details: err.message });
            }

            const resetLink = `http://localhost:3000/reset-password?token=${token}`;
            const mailOptions = {
                from: 'mutyalasai7@gmail.com',
                to: user.email,
                subject: 'Password Reset',
                text: `Click the link to reset your password: ${resetLink}`
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Error sending email:', err);
                    return res.status(500).json({ error: 'Failed to send email', details: err.message });
                }
                console.log('Email sent:', info.response);
                res.json({ message: 'Password reset email sent' });
            });
        });
    });
});

// Reset Password
app.post('/api/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    const sql = 'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()';
    db.query(sql, [token], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

        const tokenRecord = results[0];
        bcrypt.hash(newPassword, 10, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Failed to hash password' });

            const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
            db.query(updateSql, [hash, tokenRecord.user_id], (err, result) => {
                if (err) return res.status(500).json({ error: 'Failed to update password' });

                const deleteSql = 'DELETE FROM password_reset_tokens WHERE id = ?';
                db.query(deleteSql, [tokenRecord.id], (err, result) => {
                    if (err) return res.status(500).json({ error: 'Failed to delete token' });
                    res.json({ message: 'Password reset successful' });
                });
            });
        });
    });
});

const path = require('path');

// Serve reset-password.html
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Get Products
app.get('/api/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch products' });
        res.json(results);
    });
});

// Add to Cart
app.post('/api/cart', verifyToken, (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.userId;

    const sql = 'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)';
    db.query(sql, [userId, productId, quantity], (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to add to cart' });
        res.json({ message: 'Added to cart' });
    });
});

// Get Cart Items
// Get Cart Items
app.get('/api/cart', verifyToken, (req, res) => {
    const userId = req.userId;
    const sql = `
        SELECT cart.id AS cartId, products.*, cart.quantity 
        FROM cart 
        JOIN products ON cart.product_id = products.id 
        WHERE cart.user_id = ?
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch cart' });
        }
        res.json(results);
    });
});

// Remove from Cart
// Remove from Cart
// Remove from Cart
app.delete('/api/cart/:id', verifyToken, (req, res) => {
    const cartId = req.params.id;
    const userId = req.userId;

    console.log(`Deleting cart item: cartId=${cartId}, userId=${userId}`); // Debugging log

    if (!cartId || isNaN(cartId)) {
        return res.status(400).json({ error: 'Invalid cart ID' });
    }

    const sql = 'DELETE FROM cart WHERE id = ? AND user_id = ?';
    db.query(sql, [cartId, userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to remove item', details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found in your cart' });
        }
        res.json({ message: 'Item removed from cart' });
    });
});

// Get Cart Summary
app.get('/api/cart-summary', verifyToken, (req, res) => {
    const userId = req.userId;
    const sql = 'SELECT SUM(products.price * cart.quantity) AS total FROM cart JOIN products ON cart.product_id = products.id WHERE cart.user_id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch cart summary' });
        res.json(results[0]);
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});