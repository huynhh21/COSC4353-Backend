const express = require("express");
const cors = require("cors");
const mysql = require("mysql");

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "volunteer_management"
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to database.');
});

// Get all notifications for a specific user
app.get('/notifications', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const query = 'SELECT * FROM notifications WHERE userId = ?';
  db.query(query, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error retriving notifications" });
    }
    res.json(results);
  });
});

// Dismiss a notification for a specific user
app.delete('/notifications/:id', (req, res) => {
  const userId = req.query.userId;
  const { id } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const query = 'DELETE FROM notifications WHERE id = ? AND userId = ?';
  db.query(query, [id, userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error dismissing notification" });
    }
    res.status(204).send();
  });
});

// Get volunteer history for a specific user
app.get('/volunteerHistory', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const query = 'SELECT * FROM volunteer_history WHERE userId = ?';
  pool.query(query, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error retriving volunteer history" });
    }
    res.json(results);
  });
});

// Create a new pricing entry
app.post('/pricing', (req, res) => {
  const { name, description, price } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const query = 'INSERT INTO pricing (name, description, price) VALUES (?, ?, ?)';
  db.query(query, [name, description, price], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error creating pricing entry" });
    }
    res.status(201).json({ id: results.insertId, name, description, price });
  });
});

// Get all pricing entries
app.get('/pricing', (req, res) => {
  const query = 'SELECT * FROM pricing';
  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error retriving pricing entries" });
    }
    res.json(results);
  });
});

// Get a specific pricing entry by ID
app.get('/pricing/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM pricing WHERE id = ?';
  db.query(query, [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Pricing entry not found" });
    }
    res.json(results[0]);
  });
});

// Update a pricing entry by ID
app.put('/pricing/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  if (!name || !price) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  const query = 'UPDATE pricing SET name = ?, description = ?, price = ? WHERE id = ?';
  db.query(query, [name, description, price, id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Pricing entry not found' });
    }
    res.json({ id, name, description, price });
  });
});

// Delete a pricing entry by ID
app.delete('/pricing/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM pricing WHERE id = ?';
  db.query(query, [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Pricing entry not found' });
    }
    res.status(204).send();
  });
});

app.listen(8081, () => {
    console.log("listening...");
});
