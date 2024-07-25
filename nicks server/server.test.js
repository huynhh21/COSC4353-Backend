const request = require("supertest");
const express = require("express");
const cors = require("cors");
const multer = require('multer');
const path = require("path");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET", 'PUT', 'DELETE'],
    credentials: true
}));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = {
    query: jest.fn()
};

const salt = 10;

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
app.get("/", (req, res) => {
    const sql = "SELECT * FROM users";
    db.query(sql, (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

//login logic select user whose email and password matches (added hashing of password)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE Email = ?";
    
    db.query(sql, [email], (err, data) => {
        if (err) return res.status(500).json({ message: "Login Error" });
        if (data.length > 0) {
            const hashedPassword = data[0].password;
            bcrypt.compare(password.toString(), hashedPassword, (err, response) => { //compare database password to entered password hashed
                if (err) return res.json({ message: "Password compare error" });
                if (response) {
                    const userId = data[0].ID;
                    const token = jwt.sign({ userId }, "secret_key_123", { expiresIn: '1d' });
                    res.cookie('token', token);
                    return res.json({ message: "Login successful...", userId });
                } else {
                    return res.json({ message: "Password not matched" });
                }
            });
        } else {
            return res.status(401).json({ message: "Login Error. Please try again. If you don't have an account please create one." });
        }
    });
});

//creating new users and inserting into the database (hashing password implemented)
app.post('/create', (req, res) => {
    const { name, email, password } = req.body;
    const sql = "INSERT INTO users (`Name`, `Email`, `password`) VALUES (?)";
    bcrypt.hash(password.toString(), salt, (err, hash) => {
        if (err) return res.json({ message: "Error for hashing password" });
        const values = [
            name, email, hash
        ];
        db.query(sql, [values], (err, result) => {
            if (err) return res.json({ message: "Error creating user" });
            return res.json({ message: "User created successfully...", userId: result.insertId });
        });
    });
});

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ message: "You are not Authorized" });
    } else {
        jwt.verify(token, "secret_key_123", (err, decoded) => {
            if (err) {
                return res.json({ message: "Token is not ok" });
            } else {
                req.userId = decoded.userId;
                next();
            }
        });
    }
};

//once user is logged in they are redirected to their profile page
app.get('/user/:id', verifyUser, (req, res) => {
    const { id } = req.params;
    const sql = "SELECT ID, Name, Username, Email, bio, profilePic, Address1, Address2, City, State, Zipcode, Skills, Preferences, Availability FROM users WHERE ID = ?";
    db.query(sql, [id], (err, data) => {
        if (err) return res.status(500).json({ message: "Error" });
        if (data.length > 0) {
            return res.json({ Status: "Success", user: data[0] });
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


//clear cookies so now when you refresh you will no longer be authenticated.
app.get('/user/:id/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ status: "Success" });
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

// Export the app for testing
module.exports = app;


// TESTING
describe("API Tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });


    it('should fetch users', async () => {
        db.query.mockImplementation((sql, callback) => {
            callback(null, [{ ID: 1, Name: 'John Doe', Email: 'john@example.com' }]);
        });

        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([{ ID: 1, Name: 'John Doe', Email: 'john@example.com' }]);
    });


    it('should login user with valid credentials', async () => {
        const password = 'password';
        const hashedPassword = await bcrypt.hash(password, salt);

        db.query.mockImplementation((sql, params, callback) => {
            if (params[0] === 'john@example.com') {
                callback(null, [{ ID: 1, password: hashedPassword }]);
            } else {
                callback(null, []);
            }
        });

        const res = await request(app)
            .post('/login')
            .send({ email: 'john@example.com', password });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Login successful...');
        expect(res.body).toHaveProperty('userId');
        expect(res.headers['set-cookie']).toBeDefined();
    });


    it('should create a new user', async () => {
        const user = { name: 'John Doe', email: 'john@example.com', password: 'password' };

        db.query.mockImplementation((sql, params, callback) => {
            callback(null, { insertId: 1 });
        });

        const res = await request(app)
            .post('/create')
            .send(user);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'User created successfully...');
        expect(res.body).toHaveProperty('userId', 1);
    });


    it('should logout user', async () => {
        const res = await request(app).get('/user/1/logout');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'Success');
    });


    it('should fetch user profile', async () => {
        const token = jwt.sign({ userId: 1 }, "secret_key_123", { expiresIn: '1d' });

        db.query.mockImplementation((sql, params, callback) => {
            callback(null, [{ ID: 1, Name: 'John Doe', Email: 'john@example.com', Username: 'johndoe', bio: 'Hello', profilePic: 'pic.jpg', Address1: '123 Main St', Address2: '', City: 'Somewhere', State: 'CA', Zipcode: '12345', Skills: '[]', Preferences: '', Availability: '[]' }]);
        });

        const res = await request(app)
            .get('/user/1')
            .set('Cookie', [`token=${token}`]);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('Status', 'Success');
        expect(res.body.user).toHaveProperty('ID', 1);
    });


    it('should update user profile info', async () => {
        const token = jwt.sign({ userId: 1 }, "secret_key_123", { expiresIn: '1d' });

        db.query.mockImplementation((sql, params, callback) => {
            callback(null, { affectedRows: 1 });
        });

        const res = await request(app)
            .put('/user/1/update')
            .set('Cookie', [`token=${token}`])
            .field('bio', 'Updated bio')
            .attach('profilePic', Buffer.from(''), 'profile.jpg');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'User updated successfully');
    });


    it('should update user login info', async () => {
        const password = 'newpassword';
        const hashedPassword = await bcrypt.hash(password, salt);

        db.query.mockImplementation((sql, params, callback) => {
            callback(null, { affectedRows: 1 });
        });

        const res = await request(app)
            .put('/update/1')
            .send({ name: 'John Doe', email: 'john@example.com', password, username: 'johndoe' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'User updated successfully...');
    });


    it('should manage user profile', async () => {
        db.query.mockImplementation((sql, params, callback) => {
            callback(null, { affectedRows: 1 });
        });

        const res = await request(app)
            .put('/profile-management/1')
            .send({
                name: 'John Doe',
                address1: '123 Main St',
                address2: 'Apt 4',
                city: 'City',
                state: 'State',
                zipcode: '12345',
                skills: ['Organization', 'Teamwork'],
                preferences: 'Pref',
                availability: ['2024-07-18', '2024-07-20']
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ message: "profile managed successfully" });
    });

    
    it('should delete user', async () => {
        db.query.mockImplementation((sql, params, callback) => {
            callback(null, { affectedRows: 1 });
        });

        const res = await request(app).delete('/user/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ message: "User deleted successfully" });
    });
});
