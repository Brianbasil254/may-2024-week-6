const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const { check, validationResult } = require('express-validator');

// Initialize the app
const app = express();

// Configure middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));

// Configure session middleware
app.use(session({
    secret: 'werfdfrgereththytjjlokzihuhnbxcfwryu',
    resave: false,
    saveUninitialized: true
}));

// Create database server connection
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'Brian@254',
    database: 'expense_tracker',
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to expense_tracker as id ' + connection.threadId);
});

// Define a User object - registration
const User = {
    tableName: 'users',
    createUser: function (newUser, callback) {
        connection.query('INSERT INTO ' + this.tableName + ' SET ?', newUser, callback);
    },
    getUserByEmail: function (email, callback) {
        connection.query('SELECT * FROM ' + this.tableName + ' WHERE email = ?', [email], callback);
    },
    getUserByUsername: function (username, callback) {
        connection.query('SELECT * FROM ' + this.tableName + ' WHERE username = ?', [username], callback);
    },
};

// Serve the registration HTML file
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Serve the login HTML file
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Registration route
app.post('/register', [
    // Validate email and username fields
    check('email').isEmail().withMessage('Provide valid email'),
    check('username').isAlphanumeric().withMessage('Username must be alphanumeric'),

    // Custom validation to check if email and username are unique
    check('email').custom((value) => {
        return new Promise((resolve, reject) => {
            User.getUserByEmail(value, (err, results) => {
                if (err) {
                    reject(new Error('Server error'));
                }
                if (results.length > 0) {
                    reject(new Error('Email already exists'));
                }
                resolve(true);
            });
        });
    }),
    check('username').custom((value) => {
        return new Promise((resolve, reject) => {
            User.getUserByUsername(value, (err, results) => {
                if (err) {
                    reject(new Error('Server error'));
                }
                if (results.length > 0) {
                    reject(new Error('Username already exists'));
                }
                resolve(true);
            });
        });
    }),
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Create a new user object
    const newUser = {
        email: req.body.email,
        username: req.body.username,
        password: hashedPassword,
    };

    // Insert user into database
    User.createUser(newUser, (error, results) => {
        if (error) {
            console.error('Error inserting user: ' + error.message);
            return res.status(500).json({ error: error.message });
        }
        console.log('Inserted a new user with id ' + results.insertId);
        res.status(201).json('Registration succesful');
    });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Retrieve user from database
    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        const user = results[0];
        // Compare passwords
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                // Store user in session
                req.session.user = user;
                return res.send('Login successful');
            } else {
                return res.status(401).send('Invalid username or password');
            }
        });
    });
});

// Middleware to handle user authentication
const userAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Dashboard route
app.get('/dashboard', userAuthenticated, (req, res) => {
    const userFullName = req.session.user.username;
    res.render('dashboard', { username: userFullName });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
