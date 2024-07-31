const express = require("express");
const cors = require("cors");
const mysql = require("mysql");

const app = express();
app.use(express.json());

app.use(cors());

// Creating connection with database
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "volunteer_management" // database 
}) 

// Event routes
app.get("/", (req, res) => {
    const sql = "SELECT * FROM eventdetails"; // `event` is one of my tables that keeps the events and all of their information
    db.query(sql, (err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    })
})

app.post('/create', (req, res) => { // Creates an event in the `event` table
    const sql = "INSERT INTO eventdetails (`event_name`, `description`, `location`, `required_skills`, `urgency`, `eventDate`) VALUES (?)";
    const values = [
        req.body.name,
        req.body.description,
        req.body.location,
        req.body.requiredSkills,
        req.body.urgency,
        req.body.date
    ]
    db.query(sql, [values], (err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    })
})

app.put('/update/:event_id', (req, res) => { // Updates an event when a change needs to be made
    const sql = "UPDATE eventdetails SET event_name = ?, description = ?, location = ?, required_skills = ?, urgency = ?, event_date = ? WHERE event_id = ?";
    const values = [
        req.body.name,
        req.body.description,
        req.body.location,
        req.body.requiredSkills,
        req.body.urgency,
        req.body.date
    ]

    const event_id = req.params.event_id;

    db.query(sql, [...values, event_id], (err, data) => {
        if(err) {
            return res.json("Error")
        }

        //notifies the volunteers about event updates that they are attached to
        const notifyQuery = `INSERT INTO notifications (user_id, message) SELECT vh.user_id, CONCAT('Event "', ?, '" has been updated.') FROM volunteerhistory vh WHERE vh.event_id = ?`;

        db.query(notifyQuery, [event_name, event_id], (notifyErr) => {
            if (notifyErr) {
              return res.status(500).json({ error: notifyErr.message });
            }
            res.status(200).json({ message: 'Event updated and volunteers notified successfully' });
        })
    })
})

app.delete('/event/:event_id', (req, res) => { // Deletes the event from the database
    const sql = "DELETE FROM eventdetails WHERE event_id = ?";
    const event_id = req.params.event_id;

    db.query(sql, [event_id], (err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    })
})

// Volunteer routes
app.get("/volunteer", (req, res) => {
    const sql = "SELECT * FROM userprofile"; // `volunteer` is another table in my database that has everything about a volunteer as well as a column to track what event they're matched with
    db.query(sql, (err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    })
})

app.put('/match/:user_id', (req, res) => { // Matches volunteer with an event by updating their `Event` column with the name of the event
    const sql = "INSERT INTO volunteerhistory (user_id, event_id, participation) VALUES (?, ?, ?)";
    const values = [
        req.body.user_id,
        req.body.matchedEvent,
        req.body.participation
    ]

    const user_id = req.params.user_id;

    db.query(sql, [...values, user_id], (err, data) => {
        if(err) {
            return res.json("Error")
        }

        //notifies volunteer about an event they've been assigned to
        const notifyQuery = `INSERT INTO notifications (user_id, message) SELECT vh.user_id, CONCAT('You've been matched with "', ?, '" event.') FROM volunteerhistory vh WHERE vh.event_id = ?`;

        db.query(notifyQuery, [event_name, event_id], (notifyErr) => {
            if (notifyErr) {
              return res.status(500).json({ error: notifyErr.message });
            }
            res.status(200).json({ message: 'Volunteer matched and notified successfully' });
        })
    })
})

app.listen(8081, () => { // Listening
    console.log("listening");
})
