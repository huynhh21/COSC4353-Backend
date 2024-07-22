const request = require('supertest');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
app.use(express.json());
app.use(cors());

const db = {
  query: jest.fn()
};

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
  db.query(query, [userId], (error, results) => {
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

describe('API Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Pricing module tests
  describe('Pricing API', () => {
    it('should create a new pricing entry', async () => {
      connection.query = jest.fn().mockImplementation((query, values, callback) => {
        callback(null, { insertId: 1 });
      });

      const res = await request(app)
        .post('/pricing')
        .send({ name: 'Service A', description: 'Description A', price: 100.00 });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Service A');
      expect(res.body).toHaveProperty('description', 'Description A');
      expect(res.body).toHaveProperty('price', 100.00);
    });

    it('should get all pricing entries', async () => {
      connection.query = jest.fn().mockImplementation((query, callback) => {
        callback(null, [{ id: 1, name: 'Service A', description: 'Description A', price: 100.00 }]);
      });

      const res = await request(app).get('/pricing');
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('should get a specific pricing entry by ID', async () => {
      const pricingId = 1;
      connection.query = jest.fn().mockImplementation((query, values, callback) => {
        callback(null, [{ id: 1, name: 'Service A', description: 'Description A', price: 100.00 }]);
      });

      const res = await request(app).get(`/pricing/${pricingId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', pricingId);
    });

    it('should update a pricing entry by ID', async () => {
      const pricingId = 1;
      connection.query = jest.fn().mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const res = await request(app)
        .put(`/pricing/${pricingId}`)
        .send({ name: 'Service B', description: 'Description B', price: 150.00 });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', pricingId);
      expect(res.body).toHaveProperty('name', 'Service B');
      expect(res.body).toHaveProperty('description', 'Description B');
      expect(res.body).toHaveProperty('price', 150.00);
    });

    it('should delete a pricing entry by ID', async () => {
      const pricingId = 1;
      connection.query = jest.fn().mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const res = await request(app).delete(`/pricing/${pricingId}`);
      expect(res.statusCode).toBe(204);
    });
  });

  // Volunteer History module tests
  describe('Volunteer History API', () => {
    it('should get volunteer history for a specific user', async () => {
      const userId = 1;
      connection.query = jest.fn().mockImplementation((query, values, callback) => {
        callback(null, [{ id: 1, eventName: 'Beach Cleanup', eventDescription: 'Cleaning the beach area', location: 'Miami Beach', skills: 'Teamwork, Physical Strength', urgency: 'High', eventDate: '2024-07-15', userId: 1 }]);
      });

      const res = await request(app).get('/volunteerHistory').query({ userId });
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  // Notification module tests
  describe('Notification API', () => {
    it('should get notifications for a specific user', async () => {
      const userId = 1;
      connection.query = jest.fn().mockImplementation((query, values, callback) => {
        callback(null, [{ id: 1, userId: 1, message: 'New event available', createdAt: '2024-07-16' }]);
      });

      const res = await request(app).get('/notifications').query({ userId });
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('should delete a notification by ID', async () => {
      const userId = 1;
      const notificationId = 1;
      connection.query = jest.fn().mockImplementation((query, values, callback) => {
        callback(null, { affectedRows: 1 });
      });

      const res = await request(app).delete(`/notifications/${notificationId}`).query({ userId });
      expect(res.statusCode).toBe(204);
    });
  });
});