// Import 
const express = require('express');
const app = express();
const router = express.Router();
const env = require('dotenv').config().parsed;
const sqlite3 = require('sqlite3').verbose();
const port = env['PORT'] || 3000;
const db_name = env['DB_NAME'];
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

// Setting
app.use(session({
    secret: env['SECERT'],
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600000  //60000 // 60 second. 
    }
}))
app.use(express.urlencoded({extended: true}));
app.use('/public', express.static('public'));
app.use(express.json());

// View engine setup
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));


const db = new  sqlite3.Database(db_name);

// Function hashing password
const hashPassword = async(inputPassword) => {
    try {
        const hashedPassword = await bcrypt.hash(inputPassword, 12); // 12 is num of loop to hash.
        return hashedPassword
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error});
    }
}

//Authentication Login
const authLogin = (req, res, next) => {
    if(req.session && req.session.username && req.session.isLoggedIn){
        next();
    }else{
        res.render('main');
    }
 }

db.serialize(() => {
    // Create table user. [user_id, username, firstname, lastname, password, phone, age]
    db.run('CREATE TABLE IF NOT EXISTS user(user_id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, firstname TEXT, lastname TEXT, password TEXT, phone TEXT, age INTEGER )');
    // Create table appointment. [ap_id, ap_name, ap_description, status, user_id(foreign key)]
    db.run('CREATE TABLE IF NOT EXISTS appointment(ap_id INTEGER PRIMARY KEY AUTOINCREMENT, ap_name TEXT, ap_description TEXT, status BOOLEAN DEFAULT false, user_id INTEGER, FOREIGN KEY (user_id) REFERENCES user(user_id))');
});

router.get('/',(req,res) => {
    res.render('main');
});

router.get('/home', authLogin ,(req,res) => {
    res.render('home');
});

router.get('/Portfolio_Kaseamsan', authLogin, (req,res) => {
    res.render('port_b');
});

router.get('/appointment', authLogin, (req,res) => {
    res.render('appointment');
});

router.get('/bof', authLogin, (req,res) => {
    res.render('bof');
});

router.get('/information', authLogin, (req,res) => {
    res.render('info');
});

router.post('/register',async(req,res) => {
     try {
        let {username, firstname, lastname, password} = req.body;
        username = await username.toLowerCase();
        password = await password.toLowerCase();
        const hashedPassword = await hashPassword(password);

        db.run('INSERT INTO user(username, firstname, lastname, password) VALUES(?, ?, ?, ?)',[username, firstname, lastname, hashedPassword],(err) => {
            if(err){
                console.log(err);
            }else{
                res.json({ message : "register successfully." });
            }
        });
     } catch (error) {
        console.log(error);
        res.status(500).json({error: error});
     }
})

router.post('/login',(req,res) => {
    try{
        const {username, password} = req.body;
        db.all('SELECT * FROM user WHERE username = ?',[username], async(err,result) => {
            if(err){
                console.log(err);
            }else{
                if(result.length == 0){
                    res.json({num_of_user : 0});
                }else{
                    const password_db = result[0]['password'];
                    const isLogin = await bcrypt.compare(password, password_db);
                    if(isLogin){
                        req.session.username = username;
                        req.session.isLoggedIn = true;
                        req.session.user_id = result[0]['user_id'];
                        res.json({redirecTo: '/home'});
                    }else{
                        res.json({message: "password is not match."});
                    }
                }
            }
        });
    }catch(err){
        console.log(err);
    }
});
   
router.post('/add_appointment', (req,res) => {
    try {
        const {ap_name, ap_description, status, user_id} = req.body;
        db.run('INSERT INTO appointment(ap_name, ap_description, status, user_id) VALUES(?, ?, ?, ?)',[ap_name, ap_description, status, user_id], (err) => {
            if(err){
                console.log(err);
            }else{
                res.json({message: 'Add appointment successfully.'});
            }
        });
    } catch (error) {
        console.log(error);
    }
});

app.use(router);

app.listen(port,() => {console.log("Server is running.")});