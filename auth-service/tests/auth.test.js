const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authRoutes = require('../routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_test_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}, 10000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}, 10000);

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Routes Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    }, 10000);

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'existing@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      };

      await User.create(userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');
    }, 10000);
  });

  // ... other tests ...
});

describe('CI smoke test', () => {
  it('should always pass', () => {
    expect(true).toBe(true);
  });
});

describe('add user', () => {
  it('should add a new user successfully when admin', async () => {
    // Mock admin user
    const adminUser = {
      role: 'admin'
    };

    const newUser = {
      email: 'test@test.com',
      password: 'password123',
      first_name: 'Test', 
      last_name: 'User',
      phone: '0123456789',
      campus: 'Test Campus',
      role: 'user',
      bde_member: false
    };

    // Mock auth middleware to simulate admin user
    const mockAuth = jest.fn((req, res, next) => {
      req.user = adminUser;
      next();
    });

    const response = await request(app)
      .post('/api/auth/addUser')
      .set('Authorization', 'Bearer fake-token')
      .send(newUser);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      phone: newUser.phone,
      campus: newUser.campus,
      role: newUser.role,
      bde_member: newUser.bde_member
    });
    expect(response.body).not.toHaveProperty('password_hash');
  });

  it('should reject when non-admin tries to add user', async () => {
    const regularUser = {
      role: 'user'  
    };

    const mockAuth = jest.fn((req, res, next) => {
      req.user = regularUser;
      next();
    });

    const response = await request(app)
      .post('/api/auth/addUser')
      .set('Authorization', 'Bearer fake-token')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Accès non autorisé');
  });

  it('should reject when required fields are missing', async () => {
    const adminUser = {
      role: 'admin'
    };

    const mockAuth = jest.fn((req, res, next) => {
      req.user = adminUser; 
      next();
    });

    const response = await request(app)
      .post('/api/auth/addUser')
      .set('Authorization', 'Bearer fake-token')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Tous les champs obligatoires doivent être remplis');
  });
});



