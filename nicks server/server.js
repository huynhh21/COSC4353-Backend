const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt")
const multer = require('multer');
const path = require("path");
const cookieParser = require("cookie-parser");
const salt = 10; //kinda like the key or way password will be encrypted with 10 characters

//MAKE SURE TO INCREASE PASSWORD LENGTH IN DATABASE IT WILL CUTTOFF A PORTION OF THE HASHED PASSWORD

const app = express();
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET", 'PUT', 'DELETE'],
    credentials: true
}));
app.use(cookieParser()); //need this for cookies
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


//login logic select user whose email and password matches (added hashing of password)
app.post('/login', (req,res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE Email = ?";
    
    db.query(sql, [email], (err, data) => {
        if(err) return res.status(500).json({ message: "Login Error" });
        if(data.length > 0) {
            const hashedPassword = data[0].password;
            console.log(hashedPassword);
            console.log(password);
            bcrypt.compare(password.toString(), hashedPassword, (err, response) => { //compare database password to entered password hashed
                if(err) return res.json({message: "Password compare error"});
                if(response) {
                    const userId = data[0].ID;
                    const token = jwt.sign({ userId }, "secret_key_123", {expiresIn: '1d'});
                    res.cookie('token', token);
                    return res.json({ message: "Login successful...", userId }) 
                }
                else {
                    return res.json({message: "Password not matched"});
                }
            });
        } else {
            return res.status(401).json({ message: "Login Error. Please try again. If you dont have an account please create one." });
        }
    });
});


//creating new users and inserting into the database (hashing password implemented)
app.post('/create', (req, res) => {
    const { name, email, password } = req.body;
    const sql = "INSERT INTO users (`Name`, `Email`, `password`) VALUES (?)";
    bcrypt.hash(password.toString(), salt, (err, hash) => {
        if(err) return res.json({ message: "Error for hashing password" });
        console.log('Hashed password:', hash);
        const values = [
            name, email, hash
        ];
        db.query(sql, [values], (err, result) => {
            if (err) return res.json({ message: "Error creating user" });
            return res.json({ message: "User created successfully...", userId: result.insertId });
        });
    });
});


const verifyUser = (req, res, next) => { //once user is loggedin we verify by checking if we have the corect token or not
    const token = req.cookies.token;
    if(!token) {
        return res.json({ message: "You are not Authorized" });
    } else {
        jwt.verify(token, "secret_key_123", (err, decoded) => {
            if(err) {
                return res.json({ message: "Token is not ok" });
            } else {
                req.userId = decoded.userId;
                next();
            }
        })
    }
}


//once user is logged in they are redirected to there profile page (if we dont need profile pic use one above or remove pic stuff)
app.get('/user/:id', verifyUser, (req, res) => {
    const { id } = req.params;
    const sql = "SELECT ID, Name, Username, Email, bio, profilePic FROM users WHERE ID = ?";
    db.query(sql, [id], (err, data) => {
        if (err) return res.status(500).json({ message: "Error" });
        if (data.length > 0) {
            return res.json({Status: "Success", user: data[0]});
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
    let sql, params;

    if (profilePic) {
        sql = "UPDATE users SET `bio` = ?, `profilePic` = ? WHERE ID = ?";
        params = [bio, profilePic, id];
    } else {
        sql = "UPDATE users SET `bio` = ? WHERE ID = ?";
        params = [bio, id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating user" });
        return res.json({ message: "User updated successfully" });
    });
});



//logic to update user login like email password and name (when reset password, same hashing will be applied)
app.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, password, username } = req.body;
    let sql = "UPDATE users SET `Name` = ?, `Email` = ?, `Username` = ?";
    let params = [name, email, username];

    if (password) {
        bcrypt.hash(password.toString(), salt, (err, hash) => {
            if (err) return res.status(500).json({ message: "Error hashing password" });

            sql += ", `password` = ?";
            params.push(hash);

            sql += " WHERE ID = ?";
            params.push(id);

            db.query(sql, params, (err, result) => {
                if (err) return res.status(500).json({ message: "Error updating user" });
                return res.json({ message: "User updated successfully..." });
            });
        });
    } else {
        sql += " WHERE ID = ?";
        params.push(id);

        db.query(sql, params, (err, result) => {
            if (err) return res.status(500).json({ message: "Error updating user" });
            return res.json({ message: "User updated successfully..." });
        });
    }
});


//clear cookies so now when you refresh you will no longer be authenticated. (this fixes bypassing login thru url)
app.get('/user/:id/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({status: "Success"});
})


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
