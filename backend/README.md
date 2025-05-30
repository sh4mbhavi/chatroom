# Chat App Backend

A comprehensive Node.js backend server for a real-time chat application built with Express, Socket.io, MongoDB, and JWT authentication.

## Features

- **RESTful API**: Complete authentication endpoints
- **Real-time Messaging**: Socket.io integration for live chat
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Integration**: User and message persistence
- **Password Security**: bcrypt password hashing
- **Comprehensive Testing**: 120 test cases with 98% coverage

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Real-time**: Socket.io
- **Testing**: Jest with Supertest
- **Environment**: dotenv for configuration

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=9999
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (protected)

### Health Checks

- `GET /health` - Server health status
- `GET /ping` - Ping endpoint with request info
- `GET /` - Welcome message

## Testing

Our comprehensive test suite includes **120 test cases** across 6 test files with **98 passing tests**:

### Test Coverage Breakdown

#### **Authentication Tests (26 tests)**
`tests/auth.test.js`
- User registration (8 tests)
  - Successful registration with valid data
  - Password hashing verification
  - JWT token generation and validation
  - Duplicate email/username rejection
  - Missing field validation
  - Email format validation
  - Empty request handling

- User login (7 tests)
  - Valid credential authentication
  - User status management (online/offline)
  - Invalid email/password rejection
  - Missing credential handling
  - Email and password requirement validation

- User logout (6 tests)
  - Authenticated user logout
  - Status update to offline with lastSeen
  - Token validation and authorization
  - Invalid token handling
  - Malformed header handling
  - Expired token management

- JWT Token Validation (2 tests)
  - Token expiration verification (30 days)
  - User ID inclusion in token payload

- Authentication Middleware (3 tests)
  - Valid token authentication
  - Missing authorization header rejection
  - Bearer prefix requirement

#### **Database Connection Tests (12 tests)**
`tests/db.test.js`
- Successful connections (3 tests)
  - MongoDB Memory Server connection
  - Existing connection reuse
  - Reconnection handling

- Connection validation (3 tests)
  - Missing URI error handling
  - Empty URI validation
  - Null URI rejection

- Error handling (2 tests)
  - Connection error management
  - Malformed URI handling

- State management (2 tests)
  - Proper connection closure
  - Connecting state handling

- Database operations (2 tests)
  - Basic CRUD operations
  - Multiple collection support

#### **Middleware Tests (16 tests)**
`tests/middleware.test.js`
- Authentication Middleware (9 tests)
  - Valid token authentication
  - Missing authorization header handling
  - Bearer prefix requirement
  - Invalid token rejection
  - Expired token handling
  - Non-existent user handling
  - Malformed header management
  - Database error handling

- Socket Authentication Middleware (7 tests)
  - Header token authentication
  - Query parameter token support
  - Missing token rejection
  - Invalid token handling
  - Expired token management
  - User lookup errors
  - Token priority (header over query)

#### **Server Basic Endpoints (21 tests)**
`tests/server.test.js`
- Root endpoint (2 tests)
  - Welcome message response
  - JSON content type verification

- Health endpoint (2 tests)
  - OK status response
  - Response time validation

- Ping endpoint (4 tests)
  - Request info collection
  - Query parameter handling
  - Custom header inclusion
  - ISO timestamp validation

- CORS configuration (2 tests)
  - Preflight request handling
  - CORS header inclusion

- Error handling (3 tests)
  - 404 for non-existent routes
  - API route 404 handling
  - POST method 404 responses

- HTTP methods (2 tests)
  - Unsupported method rejection
  - Method validation per endpoint

- Request parsing (2 tests)
  - Malformed JSON handling
  - Valid JSON processing

- Security (2 tests)
  - Server information hiding
  - Content type handling

- Performance (2 tests)
  - Concurrent request handling
  - Large query string support

#### **User Model Tests (28 tests)**
`tests/user.model.test.js`
- Schema validation (12 tests)
  - Valid user creation
  - Required field validation (username, email, password)
  - Unique constraint enforcement
  - Email format validation
  - Minimum length requirements
  - Status field validation
  - Default value assignment

- Password hashing (3 tests)
  - Pre-save password hashing
  - Hash preservation on non-password updates
  - Hash update on password changes

- Password comparison (5 tests)
  - Correct password verification
  - Incorrect password rejection
  - Edge case handling (empty, null, undefined)

- Timestamps (2 tests)
  - CreatedAt/updatedAt creation
  - UpdatedAt modification tracking

- LastSeen field (2 tests)
  - Date assignment and retrieval
  - Null value handling

- JSON serialization (2 tests)
  - Password exclusion from JSON
  - Explicit password selection

- Database indexes (2 tests)
  - Email unique index verification
  - Username unique index verification

#### **Legacy User Tests (17 tests)**
`tests/user.test.js`
- User creation (2 tests)
- Validation (6 tests)
- Methods (2 tests)
- Uniqueness (2 tests)
- Status management (2 tests)
- Queries (3 tests)

### Test Features

- **In-Memory Database**: MongoDB Memory Server for isolated testing
- **Comprehensive Mocking**: JWT, bcrypt, and database operations
- **Error Scenario Testing**: Network failures, invalid data, edge cases
- **Security Testing**: Token validation, authentication flows
- **Performance Testing**: Concurrent requests, large payloads
- **Integration Testing**: Full request/response cycles

### Running Specific Tests

```bash
# Run specific test file
npm test auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="Authentication"

# Run tests with verbose output
npm test -- --verbose

# Generate coverage report
npm run test:coverage
```

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   └── authController.js  # Authentication logic
├── middleware/
│   ├── auth.js           # JWT authentication middleware
│   └── socketAuth.js     # Socket.io authentication
├── models/
│   ├── User.js           # User data model
│   └── Message.js        # Message data model
├── routes/
│   └── authRoutes.js     # Authentication routes
├── socketHandlers/
│   └── messageHandlers.js # Real-time message handling
├── tests/                # Comprehensive test suite
│   ├── auth.test.js      # Authentication tests
│   ├── db.test.js        # Database tests
│   ├── middleware.test.js # Middleware tests
│   ├── server.test.js    # Server endpoint tests
│   ├── user.model.test.js # User model tests
│   ├── user.test.js      # Legacy user tests
│   └── setup.js          # Test configuration
├── server.js             # Main server file
└── package.json          # Dependencies and scripts
```

## Socket.io Events

### Client to Server
- `message` - Send a new message
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room

### Server to Client
- `message` - Receive a new message
- `user_joined` - User joined notification
- `user_left` - User left notification
- `user_status` - User status update

## Database Schema

### User Schema
```javascript
{
  username: String (required, unique, min: 3)
  email: String (required, unique, valid email)
  password: String (required, min: 6, hashed)
  status: String (enum: ['online', 'offline', 'away'], default: 'offline')
  lastSeen: Date
  createdAt: Date
  updatedAt: Date
}
```

### Message Schema
```javascript
{
  content: String (required)
  sender: ObjectId (ref: 'User')
  room: String (default: 'general')
  timestamp: Date (default: Date.now)
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Mongoose schema validation
- **Error Handling**: Consistent error responses
- **Rate Limiting**: Ready for implementation

## Development Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run test:watch` - Watch mode testing
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

## Performance Considerations

- Connection pooling for MongoDB
- JWT token caching
- Socket.io room management
- Memory-efficient user status tracking
- Optimized database queries with indexes

## Production Deployment

### Environment Variables
Ensure all production environment variables are set:
- `NODE_ENV=production`
- `MONGODB_URI` (Atlas connection string)
- `JWT_SECRET` (strong secret key)
- `CLIENT_URL` (production frontend URL)

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 9999
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write comprehensive tests
4. Ensure all tests pass
5. Follow the existing code style
6. Submit a pull request

## License

This project is licensed under the ISC License. 