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
    database: "cosc4353-project" // database 
}) 

// Event routes
app.get("/", (req, res) => {
    const sql = "SELECT * FROM event"; // `event` is one of my tables that keeps the events and all of their information
    db.query(sql, (err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    })
})

app.post('/create', (req, res) => { // Creates an event in the `event` table
    const sql = "INSERT INTO event (`Name`, `Description`, `Location`, `RequiredSkills`, `Urgency`, `Date`) VALUES (?)";
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

app.put('/update/:id', (req, res) => { // Updates an event when a change needs to be made
    const sql = "update event set `Name` = ?, `Description` = ?, `Location` = ?, `RequiredSkills` = ?, `Urgency` = ?, `Date` = ? where ID = ?";
    const values = [
        req.body.name,
        req.body.description,
        req.body.location,
        req.body.requiredSkills,
        req.body.urgency,
        req.body.date
    ]

    const id = req.params.id;

    db.query(sql, [...values, id], (err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    })
})

app.delete('/event/:id', (req, res) => { // Deletes the event from the database
    const sql = "DELETE FROM event WHERE ID = ?";
    const id = req.params.id;

    db.query(sql, [id], (err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    })
})

// Volunteer routes
app.get("/volunteer", (req, res) => {
    const sql = "SELECT * FROM volunteer"; // `volunteer` is another table in my database that has everything about a volunteer as well as a column to track what event they're matched with
    db.query(sql, (err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    })
})

app.put('/match/:id', (req, res) => { // Matches volunteer with an event by updating their `Event` column with the name of the event
    const sql = "update volunteer set `Event` = ? where ID = ?";
    const values = [
        req.body.matchedEvent
    ]

    const id = req.params.id;

    db.query(sql, [...values, id], (err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    })
})

app.listen(8081, () => { // Listening
    console.log("listening");
})
