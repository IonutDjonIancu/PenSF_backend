// modules
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');
// controllers
const signInController = require('./controllers/signin.js');
const registerController = require('./controllers/register.js');
// middleware
const app = express();
app.use(cors());

// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'https://pensfportal.herokuapp.com/');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(express.urlencoded({extended: false}));
app.use(express.json());
//database
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const db = knex({
    client: 'pg',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    }
});
// serve
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`app is running on port: ${PORT}`);
});



// root
app.get('/', (req, res) => {
    res.status(200).json('welcome');
});

app.get('/ok', (req, res) => {
    res.status(200).json('ok');
});

// register
app.post('/register', (req, res) => { registerController.handleRegister(req, res, db, bcrypt) });

// signin
app.post('/signin', (req, res) => { signInController.handleSignIn(req, res, db, bcrypt); });

// profile
app.get('/profile/:id', (req, res) => {

    (db.select('*').from('users'))
    .then(data => {
        let user = data.find(elem => elem.id === parseInt(req.params.id));
        
        if (user) {
            let response = {
                id: user.id,
                name: user.name,
                entries: user.entries,
                joined: user.joined
            }
            res.status(200).json(response);
        } else {
            res.status(404).json('not found');
        }
    });
});

// saveroll
app.put('/saveroll', (req, res) => {

    (db.select('*').from('users'))
    .then(data => {
        let user = data.find(elem => elem.email === req.body.email);
        if (user) {
            
            if(user.token !== req.body.token) {
                res.status(403).json('invalid token');
                return;
            }

            db('users')
                .where('email', user.email)
                .update({
                    entries: req.body.entries,
                    rolldate: new Date()
                })
            .then(() => {
                console.log(`>>>SYSTEM MESSAGE: user entries updated \nwas: ${user.entries}\nis: ${req.body.entries}\n<<<`);
            });

            res.status(200).json('entries updated');
        } else {
            res.status(404).json('user not found');
        }
    });
});

// getrank
app.post('/getrank', (req, res) => {

    db('users')
        .orderBy('entries', 'desc')
        .orderBy('rolldate', 'asc')
    .then(data => {
        
        var elem = data.find(s => s.name === req.body.name);
        var rank = data.indexOf(elem) + 1;

        if(elem.token === req.body.token) {
            res.status(200).json(rank);
        } else {
            console.log(`>>>SYSTEM MESSAGE: request token does not match username \nname: ${req.body.name}\n<<<`);
            res.status(403).json('invalid token');
        }
    });
});

