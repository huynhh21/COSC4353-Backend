const request = require("supertest");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const app = express();
app.use(express.json());
app.use(cors());

// Mocking the database connection
const db = {
    query: jest.fn()
};

// Importing your routes
app.get("/", (req, res) => {
    const sql = "SELECT * FROM event";
    db.query(sql, (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

app.post('/create', (req, res) => {
    const sql = "INSERT INTO event (`Name`, `Description`, `Location`, `Urgency`, `Date`) VALUES (?)";
    const values = [
        req.body.name,
        req.body.description,
        req.body.location,
        req.body.urgency,
        req.body.date
    ];
    db.query(sql, [values], (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

app.put('/update/:id', (req, res) => {
    const sql = "update event set `Name` = ?, `Description` = ?, `Location` = ?, `Urgency` = ?, `Date` = ? where ID = ?";
    const values = [
        req.body.name,
        req.body.description,
        req.body.location,
        req.body.urgency,
        req.body.date
    ];
    const id = req.params.id;
    db.query(sql, [...values, id], (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

app.delete('/event/:id', (req, res) => {
    const sql = "DELETE FROM event WHERE ID = ?";
    const id = req.params.id;
    db.query(sql, [id], (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

app.get("/volunteer", (req, res) => {
    const sql = "SELECT * FROM volunteer";
    db.query(sql, (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

app.put('/match/:id', (req, res) => {
    const sql = "update volunteer set `Event` = ? where ID = ?";
    const values = [
        req.body.matchedEvent
    ];
    const id = req.params.id;
    db.query(sql, [...values, id], (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

// Tests
describe("API Tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("GET / should return all events", async () => {
        const mockData = [{ ID: 1, Name: "Test Event", Description: "Description", Location: "Location", Urgency: "High", Date: "2024-07-18" }];
        db.query.mockImplementation((sql, callback) => {
            callback(null, mockData);
        });

        const response = await request(app).get("/");
        expect(response.body).toEqual(mockData);
    });

    it("POST /create should create a new event", async () => {
        const mockData = { affectedRows: 1 };
        db.query.mockImplementation((sql, values, callback) => {
            callback(null, mockData);
        });

        const response = await request(app)
            .post("/create")
            .send({
                name: "New Event",
                description: "New Description",
                location: "New Location",
                urgency: "Medium",
                date: "2024-07-19"
            });

        expect(response.body).toEqual(mockData);
    });

    it("PUT /update/:id should update an event", async () => {
        const mockData = { affectedRows: 1 };
        db.query.mockImplementation((sql, values, callback) => {
            callback(null, mockData);
        });

        const response = await request(app)
            .put("/update/1")
            .send({
                name: "Updated Event",
                description: "Updated Description",
                location: "Updated Location",
                urgency: "Low",
                date: "2024-07-20"
            });

        expect(response.body).toEqual(mockData);
    });

    it("DELETE /event/:id should delete an event", async () => {
        const mockData = { affectedRows: 1 };
        db.query.mockImplementation((sql, values, callback) => {
            callback(null, mockData);
        });

        const response = await request(app).delete("/event/1");
        expect(response.body).toEqual(mockData);
    });

    it("GET /volunteer should return all volunteers", async () => {
        const mockData = [{ ID: 1, Name: "Test Volunteer", Event: "Test Event" }];
        db.query.mockImplementation((sql, callback) => {
            callback(null, mockData);
        });

        const response = await request(app).get("/volunteer");
        expect(response.body).toEqual(mockData);
    });

    it("PUT /match/:id should match a volunteer with an event", async () => {
        const mockData = { affectedRows: 1 };
        db.query.mockImplementation((sql, values, callback) => {
            callback(null, mockData);
        });

        const response = await request(app)
            .put("/match/1")
            .send({
                matchedEvent: "New Event"
            });

        expect(response.body).toEqual(mockData);
    });
});
