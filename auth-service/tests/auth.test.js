const request = require('supertest');
const app = require('../server'); 

describe('Auth routes', () => {
  it('should return 200 on /auth/login', async () => {
    const res = await request(app).post('/auth/login').send({
            email: 'test@test.com',
            password: 'test'
        });
        expect(res.statusCode).toBe(200);
    });
});
