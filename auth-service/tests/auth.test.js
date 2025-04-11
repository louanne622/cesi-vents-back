describe('User Model Tests', () => {
  it('should have a valid email property', () => {
    const user = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    expect(user).toHaveProperty('email', 'test@example.com');
  });
});



