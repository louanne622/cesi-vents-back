
## Technologies Used

- **Node.js**: JavaScript runtime
- **Express**: Web framework for Node.js
- **MongoDB**: NoSQL database
- **Mongoose**: ODM ( Object Documents Mapper) for MongoDB
- **Jest**: Testing framework
- **Supertest**: HTTP assertions for testing
- **Docker**: Containerization platform
- **Docker Compose**: Tool for defining and running multi-container Docker applications

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/cesi-vents-backend.git
   cd cesi-vents-backend
   ```

2. **Run the application using Docker Compose:**

   Ensure you have Docker and Docker Compose installed on your machine. Then, run:

   ```bash
   docker-compose up
   ```

   This command will build and start all the services defined in the `docker-compose.yml` file.

## API Endpoints

### Authentication

- **POST /api/auth/register**: Register a new user
- **POST /api/auth/login**: Login a user
- **GET /api/auth/me**: Get current user data

### User Management

- **POST /api/auth/addUser**: Add a new user (admin only)
