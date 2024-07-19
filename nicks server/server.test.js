const request = require("supertest");
const express = require("express");
const cors = require("cors");
const multer = require('multer');
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = {
    query: jest.fn()
};

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

//login logic select user whose email and password matches
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE Email = ? AND password = ?";
    
    db.query(sql, [email, password], (err, data) => {
        if (err) return res.status(500).json({ message: "Error" });
        if (data.length > 0) {
            const userId = data[0].ID;
            return res.json({ message: "Login successful...", userId });
        } else {
            return res.status(401).json({ message: "Login Error. Please try again. If you don't have an account please create one." });
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

//once user is logged in they are redirected to their profile page (if we don't need profile pic use one above or remove pic stuff)
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
    let sql = "UPDATE users SET `Name` = ?, `Email` = ?, `Username` = ?";
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

    it('should login user', async () => {
        db.query.mockImplementation((sql, params, callback) => {
            if (params[0] === 'john@example.com' && params[1] === 'password') {
                callback(null, [{ ID: 1 }]);
            } else {
                callback(null, []);
            }
        });

        const res = await request(app)
            .post('/login')
            .send({ email: 'john@example.com', password: 'password' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ message: "Login successful...", userId: 1 });

        const res2 = await request(app)
            .post('/login')
            .send({ email: 'john@example.com', password: 'wrongpassword' });
        expect(res2.statusCode).toEqual(401);
        expect(res2.body).toEqual({ message: "Login Error. Please try again. If you don't have an account please create one." });
    });

    it('should create a new user', async () => {
        db.query.mockImplementation((sql, values, callback) => {
            callback(null, { insertId: 1 });
        });

        const res = await request(app)
            .post('/create')
            .send({ name: 'John Doe', email: 'john@example.com', password: 'password' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ message: "User created successfully...", userId: 1 });
    });

    it('should get user by ID', async () => {
        db.query.mockImplementation((sql, params, callback) => {
            if (params[0] === '1') {
                callback(null, [{ ID: 1, Name: 'John Doe', Username: 'johndoe', Email: 'john@example.com', bio: 'Bio', profilePic: 'pic.jpg' }]);
            } else {
                callback(null, []);
            }
        });

        const res = await request(app).get('/user/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ ID: 1, Name: 'John Doe', Username: 'johndoe', Email: 'john@example.com', bio: 'Bio', profilePic: 'pic.jpg' });

        const res2 = await request(app).get('/user/999');
        expect(res2.statusCode).toEqual(404);
        expect(res2.body).toEqual({ message: "User not found" });
    });

    it('should update user profile', async () => {
        db.query.mockImplementation((sql, params, callback) => {
            callback(null, { affectedRows: 1 });
        });

        const res = await request(app)
            .put('/user/1/update')
            .send({ bio: 'New Bio' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ message: "User updated successfully" });
    });

    it('should update user login info', async () => {
        db.query.mockImplementation((sql, params, callback) => {
            callback(null, { affectedRows: 1 });
        });

        const res = await request(app)
            .put('/update/1')
            .send({ name: 'John Doe', email: 'john@example.com', password: 'newpassword', username: 'johndoe' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ message: "User updated successfully..." });
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
