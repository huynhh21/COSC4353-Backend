const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const multer = require('multer');
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "crud" //name is just crud. running Apache and mysql
});


db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});


//for profile pic might not be necessary
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


//gets users from database
app.get("/", (req,res) =>{
    const sql = "SELECT * FROM users";
    db.query(sql,(err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    });
});

//login logic select user whose email and password matches
app.post('/login', (req,res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE Email = ? AND password = ?";
    
    db.query(sql, [email, password], (err, data) => {
        if(err) return res.status(500).json({ message: "Error" });
        if(data.length > 0) {
            const userId = data[0].ID;
            return res.json({ message: "Login successful...", userId })
        } else {
            return res.status(401).json({ message: "Login Error. Please try again. If you dont have an account please create one." });
        }
    });
});


//creating new users and inserting into the database
app.post('/create', (req, res) => {
    const sql = "INSERT INTO users (`Name`, `Email`, `password`) VALUES (?)";
    const values = [
        req.body.name,
        req.body.email,
        req.body.password
    ];
    db.query(sql, [values], (err, result) => {
        if (err) return res.json({ message: "Error" });
        return res.json({ message: "User created successfully...", userId: result.insertId });
    });
});



//once user is logged in they are redirected to there profile page (if we dont need profile pic use one above or remove pic stuff)
app.get('/user/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT ID, Name, Username, Email, bio, profilePic FROM users WHERE ID = ?";
    db.query(sql, [id], (err, data) => {
        if (err) return res.status(500).json({ message: "Error" });
        if (data.length > 0) {
            return res.json(data[0]);
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    });
});


//logic to update user profile info includes profile pic stuff
app.put('/user/:id/update', upload.single('profilePic'), (req, res) => {
    const { id } = req.params;
    const { bio } = req.body;
    let profilePic = null;
    if (req.file) {
        profilePic = `/uploads/${req.file.filename}`;
    }

    const sql = profilePic ? 
        "UPDATE users SET `bio` = ?, `profilePic` = ? WHERE ID = ?" :
        "UPDATE users SET `bio` = ? WHERE ID = ?";

    const params = profilePic ? [bio, profilePic, id] : [bio, id];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating user" });
        return res.json({ message: "User updated successfully" });
    });
});


//logic to update user login like email password and name
app.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, password, username } = req.body;
    let sql = "UPDATE busers SET `Name` = ?, `Email` = ?, `Username` = ?";
    let params = [name, email, username];

    if (password) {
        sql += ", `password` = ?";
        params.push(password);
    }
    
    sql += " WHERE ID = ?";
    params.push(id);
    
    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating user" });
        return res.json({ message: "User updated successfully..." });
    });
});


//logic for profile management
app.put('/profile-management/:id', (req, res) => {
    const { id } = req.params;
    const { name, address1, address2, city, state, zipcode, skills, preferences, availability } = req.body;
    const sql = "UPDATE users SET `Name` = ?, `Address1` = ?, `Address2` = ?, `City` = ?, `State` = ?, `Zipcode` = ?, `Skills` = ?, `Preferences` = ?, `Availability` = ? WHERE ID = ?";
    db.query(sql, [name, address1, address2, city, state, zipcode, JSON.stringify(skills), preferences, JSON.stringify(availability), id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating profile management" });
        return res.json({ message: "profile managed successfully" });
    });
});


//logic to remove user
app.delete('/user/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM users WHERE ID = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error deleting user" });
        return res.json({ message: "User deleted successfully" });
    });
});


app.listen(8081, () => {
    console.log("listening...");
});
