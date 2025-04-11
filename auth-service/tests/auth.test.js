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

// Mock des dépendances
jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Service Tests', () => {
  beforeEach(() => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();
  });

  describe('Register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        _id: 'mockId'
      };

      // Mock de la création d'utilisateur
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('mockToken');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        token: 'mockToken',
        user: mockUser
      });
      expect(User.create).toHaveBeenCalledTimes(1);
    });

    it('should not register user with existing email', async () => {
      User.findOne.mockResolvedValue({ email: 'existing@test.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@test.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists');
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('Login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        email: 'test@test.com',
        password: 'hashedPassword',
        _id: 'mockId'
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockToken');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token: 'mockToken',
        user: mockUser
      });
    });

    it('should not login with incorrect password', async () => {
      const mockUser = {
        email: 'test@test.com',
        password: 'hashedPassword'
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('Get User Profile', () => {
    it('should return user data with valid token', async () => {
      const mockUser = {
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        _id: 'mockId'
      };

      jwt.verify.mockReturnValue({ id: 'mockId' });
      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer validToken');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('should not allow access without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token, authorization denied');
    });
  });
});