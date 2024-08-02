const request = require('supertest');
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const pdf = require('html-pdf');
const { Parser } = require('json2csv');
const path = require('path');
const app = require('./server');

// Mock MySQL connection
const db = {
    query: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    connect: jest.fn((callback) => callback())
};

jest.mock('mysql', () => ({
    createConnection: jest.fn(() => db)
}));

// Mock bcrypt and jwt
jest.mock('bcrypt', () => ({
    hash: jest.fn((password, salt, callback) => callback(null, 'hashedPassword')),
    compare: jest.fn((password, hashedPassword, callback) => callback(null, true))
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'token'),
    verify: jest.fn((token, secret, callback) => callback(null, { userId: 1 }))
}));

describe('API Tests', () => {
    it('should fetch user profile', async () => {
        db.query.mockImplementationOnce((sql, params, callback) => {
            callback(null, [{ user_id: 1, full_name: 'Test User' }]);
        }).mockImplementationOnce((sql, params, callback) => {
            callback(null, [{ email: 'test@example.com' }]);
        });

        const res = await request(app)
            .get('/user/1')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.body[0]).toHaveProperty('user_id', 1);
        expect(res.body[0]).toHaveProperty('full_name', 'Test User');
    });

    it('should login user', async () => {
        db.query.mockImplementationOnce((sql, params, callback) => {
            callback(null, [{ user_id: 1, password: 'hashedPassword', role: 'user' }]);
        });

        const res = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'password' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Login successful...');
    });

    it('should create user', async () => {
        db.query.mockImplementationOnce((sql, params, callback) => {
            callback(null, { insertId: 1 });
        }).mockImplementationOnce((sql, params, callback) => {
            callback(null, {});
        });

        const res = await request(app)
            .post('/create')
            .send({ name: 'Test User', email: 'test@example.com', password: 'password' });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'User created successfully...');
    });

    it('should update user profile', async () => {
        db.query.mockImplementationOnce((sql, params, callback) => {
            callback(null, {});
        });

        const res = await request(app)
            .put('/user/1/update')
            .send({ full_name: 'Updated User', username: 'updateduser' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'User profile updated successfully');
    });

    it('should delete user', async () => {
        db.query.mockImplementationOnce((sql, params, callback) => {
            callback(null, {});
        }).mockImplementationOnce((sql, params, callback) => {
            callback(null, {});
        });

        const res = await request(app)
            .delete('/user/1');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should fetch all events', async () => {
        db.query.mockImplementationOnce((sql, callback) => {
            callback(null, [{ event_id: 1, event_name: 'Test Event' }]);
        });

        const res = await request(app)
            .get('/events')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.body[0]).toHaveProperty('event_id', 1);
        expect(res.body[0]).toHaveProperty('event_name', 'Test Event');
    });

    it('should create an event', async () => {
        db.query.mockImplementationOnce((sql, values, callback) => {
            callback(null, { insertId: 1 });
        });

        const res = await request(app)
            .post('/events/create')
            .send({
                name: 'New Event',
                description: 'Event Description',
                location: 'Event Location',
                requiredSkills: 'Skill1, Skill2',
                urgency: 'High',
                date: '2024-08-01'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('insertId', 1);
    });

    it('should update an event and notify volunteers', async () => {
        db.query
            .mockImplementationOnce((sql, values, callback) => {
                callback(null, {});
            })
            .mockImplementationOnce((sql, values, callback) => {
                callback(null, {});
            });

        const res = await request(app)
            .put('/events/update/1')
            .send({
                name: 'Updated Event',
                description: 'Updated Description',
                location: 'Updated Location',
                requiredSkills: 'Updated Skill1, Updated Skill2',
                urgency: 'Low',
                date: '2024-08-01'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Event updated and volunteers notified successfully');
    });

    it('should delete an event', async () => {
        db.query.mockImplementationOnce((sql, values, callback) => {
            callback(null, {});
        });

        const res = await request(app)
            .delete('/events/1');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Event deleted successfully');
    });

    it('should fetch all volunteers', async () => {
        db.query.mockImplementationOnce((sql, callback) => {
            callback(null, [{ user_id: 1, full_name: 'Volunteer User' }]);
        });

        const res = await request(app)
            .get('/volunteers')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.body[0]).toHaveProperty('user_id', 1);
        expect(res.body[0]).toHaveProperty('full_name', 'Volunteer User');
    });

    it('should match a volunteer with an event and notify them', async () => {
        db.query
            .mockImplementationOnce((sql, values, callback) => {
                callback(null, {});
            })
            .mockImplementationOnce((sql, values, callback) => {
                callback(null, {});
            });

        const res = await request(app)
            .put('/volunteers/match/1')
            .send({
                user_id: 1,
                matchedEvent: 1,
                participation: 'Scheduled'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Volunteer matched and notified successfully');
    });

    it('should fetch notifications for a user', async () => {
        db.query.mockImplementationOnce((sql, params, callback) => {
            callback(null, [{ notification_id: 1, message: 'Test Notification' }]);
        });

        const res = await request(app)
            .get('/notifications?userId=1')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.body[0]).toHaveProperty('notification_id', 1);
        expect(res.body[0]).toHaveProperty('message', 'Test Notification');
    });

    it('should delete a notification for a user', async () => {
        db.query.mockImplementationOnce((sql, params, callback) => {
            callback(null, {});
        });

        const res = await request(app)
            .delete('/notifications/1?userId=1')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(204);
    });

    it('should fetch volunteer history for a user', async () => {
        db.query.mockImplementationOnce((sql, params, callback) => {
            callback(null, [{
                participation: 'Participated',
                event_name: 'Test Event',
                description: 'Test Description',
                location: 'Test Location',
                required_skills: 'Skill1, Skill2',
                urgency: 'High',
                event_date: '2024-08-01'
            }]);
        });

        const res = await request(app)
            .get('/volunteerHistory?user_id=1')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.body[0]).toHaveProperty('participation', 'Participated');
        expect(res.body[0]).toHaveProperty('event_name', 'Test Event');
    });

    it('should create a pricing entry', async () => {
        db.query.mockImplementationOnce((sql, values, callback) => {
            callback(null, { insertId: 1 });
        });

        const res = await request(app)
            .post('/pricing')
            .send({ name: 'New Pricing', description: 'Pricing Description', price: 100 });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id', 1);
        expect(res.body).toHaveProperty('name', 'New Pricing');
        expect(res.body).toHaveProperty('description', 'Pricing Description');
        expect(res.body).toHaveProperty('price', 100);
    });

    it('should fetch all pricing entries', async () => {
        db.query.mockImplementationOnce((sql, callback) => {
            callback(null, [{ id: 1, name: 'Pricing Entry', description: 'Description', price: 100 }]);
        });

        const res = await request(app)
            .get('/pricing')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.body[0]).toHaveProperty('id', 1);
        expect(res.body[0]).toHaveProperty('name', 'Pricing Entry');
    });

    it('should fetch a pricing entry by id', async () => {
        db.query.mockImplementationOnce((sql, params, callback) => {
            callback(null, [{ id: 1, name: 'Pricing Entry', description: 'Description', price: 100 }]);
        });

        const res = await request(app)
            .get('/pricing/1')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', 1);
        expect(res.body).toHaveProperty('name', 'Pricing Entry');
    });

    it('should update a pricing entry', async () => {
        db.query.mockImplementationOnce((sql, values, callback) => {
            callback(null, { affectedRows: 1 });
        });

        const res = await request(app)
            .put('/pricing/1')
            .send({ name: 'Updated Pricing', description: 'Updated Description', price: 200 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', 1);
        expect(res.body).toHaveProperty('name', 'Updated Pricing');
        expect(res.body).toHaveProperty('description', 'Updated Description');
        expect(res.body).toHaveProperty('price', 200);
    });

    it('should delete a pricing entry', async () => {
        db.query.mockImplementationOnce((sql, params, callback) => {
            callback(null, { affectedRows: 1 });
        });

        const res = await request(app)
            .delete('/pricing/1')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(204);
    });

    it('should generate a CSV report for volunteer activity', async () => {
        db.query.mockImplementationOnce((sql, callback) => {
            callback(null, [{
                full_name: 'Test User',
                participation: 'Participated',
                event_name: 'Test Event',
                description: 'Test Description',
                location: 'Test Location',
                required_skills: 'Skill1, Skill2',
                urgency: 'High',
                event_date: '2024-08-01'
            }]);
        });

        const res = await request(app)
            .get('/reports/volunteer-activity?format=csv')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('text/csv');
    });

    it('should generate a PDF report for volunteer activity', async () => {
        db.query.mockImplementationOnce((sql, callback) => {
            callback(null, [{
                full_name: 'Test User',
                participation: 'Participated',
                event_name: 'Test Event',
                description: 'Test Description',
                location: 'Test Location',
                required_skills: 'Skill1, Skill2',
                urgency: 'High',
                event_date: '2024-08-01'
            }]);
        });

        const res = await request(app)
            .get('/reports/volunteer-activity?format=pdf')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('should generate a CSV report for event management', async () => {
        db.query.mockImplementationOnce((sql, callback) => {
            callback(null, [{
                event_name: 'Test Event',
                description: 'Test Description',
                location: 'Test Location',
                required_skills: 'Skill1, Skill2',
                urgency: 'High',
                event_date: '2024-08-01',
                full_name: 'Test User'
            }]);
        });

        const res = await request(app)
            .get('/reports/event-management?format=csv')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('text/csv');
    });

    it('should generate a PDF report for event management', async () => {
        db.query.mockImplementationOnce((sql, callback) => {
            callback(null, [{
                event_name: 'Test Event',
                description: 'Test Description',
                location: 'Test Location',
                required_skills: 'Skill1, Skill2',
                urgency: 'High',
                event_date: '2024-08-01',
                full_name: 'Test User'
            }]);
        });

        const res = await request(app)
            .get('/reports/event-management?format=pdf')
            .set('Cookie', ['token=token']);

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('application/pdf');
    });
});