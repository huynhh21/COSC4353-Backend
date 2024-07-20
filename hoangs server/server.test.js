const request = require('supertest');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const { expect } = require('chai');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'volunteer_management',
  multipleStatements: true,
});

// Endpoint definitions
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


app.get('/pricing', (req, res) => {
    const query = 'SELECT * FROM pricing';
    db.query(query, (error, results) => {
        if (error) {
        return res.status(500).json({ message: "Error retriving pricing entries" });
        }
        res.json(results);
    });
});


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

describe('Notifications API', () => {
  it('should fetch all notifications for a specific user', (done) => {
    const userId = 1;
    request(app)
      .get('/notifications')
      .query({ userId })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should return 400 if userId is not provided', (done) => {
    request(app)
      .get('/notifications')
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('error', 'User ID is required');
        done();
      });
  });

  it('should dismiss a notification for a specific user', (done) => {
    const userId = 1;
    const idToDelete = 1;
    request(app)
      .delete(`/notifications/${idToDelete}`)
      .query({ userId })
      .expect(204, done);
  });

  it('should return 400 if userId is not provided when dismissing a notification', (done) => {
    const idToDelete = 1;
    request(app)
      .delete(`/notifications/${idToDelete}`)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('error', 'User ID is required');
        done();
      });
  });
});

describe('Volunteer History API', () => {
  it('should fetch volunteer history for a specific user', (done) => {
    const userId = 1;
    request(app)
      .get('/volunteerHistory')
      .query({ userId })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should return 400 if userId is not provided', (done) => {
    request(app)
      .get('/volunteerHistory')
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('error', 'User ID is required');
        done();
      });
  });
});

describe('Pricing API', () => {
    it('should create a new pricing entry', (done) => {
    request(app)
    .post('/pricing')
    .send({ name: 'Service A', description: 'Description A', price: 100.00 })
    .expect(201)
    .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('name', 'Service A');
        expect(res.body).to.have.property('description', 'Description A');
        expect(res.body).to.have.property('price', 100.00);
        done();
    });
    });

    it('should get all pricing entries', (done) => {
    request(app)
    .get('/pricing')
    .expect(200)
    .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.be.an('array');
        done();
    });
    });

    it('should get a specific pricing entry by ID', (done) => {
    const pricingId = 1; // Assume there's a pricing entry with ID 1 in the database
    request(app)
    .get(`/pricing/${pricingId}`)
    .expect(200)
    .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('id', pricingId);
        done();
    });
    });

    it('should update a pricing entry by ID', (done) => {
    const pricingId = 1; // Assume there's a pricing entry with ID 1 in the database
    request(app)
    .put(`/pricing/${pricingId}`)
    .send({ name: 'Service B', description: 'Description B', price: 150.00 })
    .expect(200)
    .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('id', pricingId);
        expect(res.body).to.have.property('name', 'Service B');
        expect(res.body).to.have.property('description', 'Description B');
        expect(res.body).to.have.property('price', 150.00);
        done();
    });
    });

    it('should delete a pricing entry by ID', (done) => {
    const pricingId = 1; // Assume there's a pricing entry with ID 1 in the database
    request(app)
    .delete(`/pricing/${pricingId}`)
    .expect(204)
    .end((err) => {
        if (err) return done(err);
        done();
    });
  });
});