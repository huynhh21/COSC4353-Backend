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

// Importing routes
app.get("/", (req, res) => {
    const sql = "SELECT * FROM eventdetails";
    db.query(sql, (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

app.post('/create', (req, res) => {
    const sql = "INSERT INTO eventdetails (`event_name`, `description`, `location`, `required_skills`, `urgency`, `eventDate`) VALUES (?)";
    const values = [
        req.body.name,
        req.body.description,
        req.body.location,
        req.body.requiredSkills,
        req.body.urgency,
        req.body.date
    ];
    db.query(sql, [values], (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

app.put('/update/:event_id', (req, res) => {
    const sql = "UPDATE eventdetails SET `event_name` = ?, `description` = ?, `location` = ?, `required_skills` = ?, `urgency` = ?, `eventDate` = ? WHERE event_id = ?";
    const values = [
        req.body.name,
        req.body.description,
        req.body.location,
        req.body.requiredSkills,
        req.body.urgency,
        req.body.date
    ];
    const event_id = req.params.event_id;
    db.query(sql, [...values, event_id], (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

app.delete('/event/:event_id', (req, res) => {
    const sql = "DELETE FROM eventdetails WHERE event_id = ?";
    const event_id = req.params.event_id;
    db.query(sql, [event_id], (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

app.get("/volunteer", (req, res) => {
    const sql = "SELECT * FROM userprofile";
    db.query(sql, (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

app.put('/match/:user_id', (req, res) => {
    const sql = "UPDATE userprofile SET `event_match` = ? WHERE user_id = ?";
    const values = [
        req.body.matchedEvent
    ];
    const user_id = req.params.user_id;
    db.query(sql, [...values, user_id], (err, data) => {
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
        const mockData = [{ event_id: 1, event_name: "Test Event", description: "Description", location: "Location", required_skills: "Skills", urgency: "High", eventDate: "2024-07-18" }];
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
                requiredSkills: "Skills",
                urgency: "Medium",
                date: "2024-07-19"
            });

        expect(response.body).toEqual(mockData);
    });

    it("PUT /update/:event_id should update an event", async () => {
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
                requiredSkills: "Updated Skills",
                urgency: "Low",
                date: "2024-07-20"
            });

        expect(response.body).toEqual(mockData);
    });

    it("DELETE /event/:event_id should delete an event", async () => {
        const mockData = { affectedRows: 1 };
        db.query.mockImplementation((sql, values, callback) => {
            callback(null, mockData);
        });

        const response = await request(app).delete("/event/1");
        expect(response.body).toEqual(mockData);
    });

    it("GET /volunteer should return all volunteers", async () => {
        const mockData = [{ user_id: 1, name: "Test Volunteer", event_match: "Test Event" }];
        db.query.mockImplementation((sql, callback) => {
            callback(null, mockData);
        });

        const response = await request(app).get("/volunteer");
        expect(response.body).toEqual(mockData);
    });

    it("PUT /match/:user_id should match a volunteer with an event", async () => {
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
