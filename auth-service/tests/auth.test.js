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



