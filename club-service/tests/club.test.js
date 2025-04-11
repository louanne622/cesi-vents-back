describe('CI smoke test', () => {
    it('should always pass', () => {
      expect(true).toBe(true);
    });
  });

  describe('Club Service Tests', () => {
    let club;

    beforeEach(async () => {
      club = await Club.create({
        name: 'Test Club',
        description: 'Test Description',
        location: 'Test Location',
        image: 'test-image.jpg',
        owner: 'test-owner'
      });
    });
  

