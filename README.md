# Web Dev III: Lab 4 – Secure Connect and Communication Platform

A production-grade, secure, and event-driven backend platform built with **Node.js**, **Express.js**, **MongoDB & Mongoose**, **JWT authentication**, **bcrypt password encryption**, **Socket.IO real-time chat**, and **Node.js EventEmitter**.

---

## 1. Project Overview

The **Secure Connect and Communication Platform** fulfills all backend requirements for Web Dev III Lab 4:
- **Manual Authentication**: Implements user registration and login manually without pre-built boilerplates.
- **Password Security**: Passwords are salted and hashed with `bcrypt` (10 rounds); hashes are never exposed in responses.
- **JWT Verification**: Protected endpoints require standard `Bearer <token>` in the `Authorization` header.
- **Role-Based Access Control (RBAC)**: Supports `user` and `admin` roles, restricting elevated endpoints and returning `403 Forbidden` for unauthorized attempts.
- **Secure Notes CRUD**: Complete user-isolated CRUD for notes. Users can only view, update, or delete their own notes.
- **Real-Time Chat (Socket.IO)**: Multi-room real-time messaging with room join (`join_room`), broadcast (`send_message`, `receive_message`), and connection/disconnection tracking.
- **Domain Event Tracking (EventEmitter)**: Decoupled event logging for `user_registered`, `user_logged_in`, `note_created`, and `note_deleted`.

---

## 2. Technologies Used

- **Runtime**: Node.js (v24 LTS / v18+)
- **Web Framework**: Express.js (v5)
- **Database & ODM**: MongoDB with Mongoose (v9)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`)
- **Encryption**: `bcrypt` / `bcryptjs`
- **Environment Management**: `dotenv`
- **Real-Time Communication**: `socket.io`
- **Asynchronous Events**: Node.js Native `EventEmitter`
- **CORS Support**: `cors`

---

## 3. Project Folder Structure

```
secure-connect-platform/
│
├── config/
│   └── db.js                  # MongoDB Mongoose connection configuration
│
├── controllers/
│   ├── authController.js     # User registration, login, profile, admin logic
│   └── noteController.js     # Note CRUD with user isolation & validation
│
├── middleware/
│   ├── authMiddleware.js     # JWT Bearer token authentication middleware
│   └── roleMiddleware.js     # Role-based access control (RBAC) middleware
│
├── models/
│   ├── User.js               # Mongoose User model with hidden passwords
│   └── Note.js               # Mongoose Note model linked to User
│
├── routes/
│   ├── authRoutes.js         # /api/auth routes (signup, login, profile, admin)
│   └── noteRoutes.js         # /api/notes routes (CRUD)
│
├── events/
│   └── eventEmitter.js       # Node.js EventEmitter instance & event listeners
│
├── socket/
│   └── chat.js               # Socket.IO chat room & messaging handlers
│
├── test/
│   └── test-scenarios.js     # Automated verification suite (All 14 scenarios)
│
├── public/
│   └── index.html            # Interactive visual Socket.IO browser chat client
│
├── .env                      # Environment secrets (PORT, MONGO_URI, JWT_SECRET)
├── .env.example              # Template environment configuration
├── .gitignore                # Git ignore patterns
├── package.json              # Project dependencies and npm scripts
├── postman_collection.json   # Ready-to-import Postman test collection
├── server.js                 # Application entry point (Express + HTTP + Socket.IO)
└── README.md                 # Complete documentation and testing instructions
```

---

## 4. Environment Configuration

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/secure_connect_db
JWT_SECRET=super_secret_jwt_key_lab4_secure_connect_platform_2026
JWT_EXPIRE=24h
NODE_ENV=development
```

---

## 5. Installation and Setup

### Step 1: Install Dependencies
Open your terminal in the project directory:
```bash
npm install
```

### Step 2: Ensure MongoDB Is Running
Ensure your local MongoDB daemon is running on port `27017`:
```bash
# Example if starting manually:
mongod --dbpath ./data/db --port 27017
```

### Step 3: Start the Backend Server
```bash
# Normal start
npm start

# Development mode (auto-restart on changes)
npm run dev
```

Server output upon startup:
```text
[MongoDB] Connected successfully to host: 127.0.0.1
[MongoDB] Database Name: secure_connect_db
===========================================================
  Secure Connect and Communication Platform Server
  Listening on port: 3000
  API Base URL    : http://localhost:3000
  Socket.IO       : Active and ready for connections
===========================================================
```

---

## 6. Automated Verification (All 14 Scenarios)

The project includes an automated test runner verifying every single assignment requirement:
```bash
npm test
```

This verifies:
1. `POST /api/auth/signup` (Successful signup)
2. `POST /api/auth/signup` (Duplicate email check)
3. `POST /api/auth/login` (Successful login & JWT issuance)
4. `POST /api/auth/login` (Incorrect password handling)
5. `GET /api/notes` (Access protected route without token -> 401)
6. `GET /api/auth/profile` (Access protected route with valid token -> 200)
7. `POST /api/notes` (Create secure note -> 201)
8. `GET /api/notes` (Retrieve owner's notes -> 200)
9. `GET /api/notes/:id` (Retrieve single note -> 200)
10. `PUT /api/notes/:id` (Update note -> 200)
11. `DELETE /api/notes/:id` (Delete note -> 200)
12. `GET /api/notes/:id` (Attempt to access another user's note -> 403 Forbidden)
13. `GET /api/auth/admin` (RBAC: User blocked with 403, Admin allowed with 200)
14. Real-time chat with two connected Socket.IO clients (`join_room`, `send_message`, `receive_message`)

---

## 7. API Reference and Endpoints

### A. Authentication Endpoints (`/api/auth`)

#### 1. User Signup
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/signup`
- **Header**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "username": "alice",
    "email": "alice@example.com",
    "password": "Password@123",
    "role": "user"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "id": "673f1c8b9d3e8a4a5c6d7e8f",
      "username": "alice",
      "email": "alice@example.com",
      "role": "user",
      "createdAt": "2026-11-21T17:30:00.000Z"
    }
  }
  ```

#### 2. User Login
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/login`
- **Header**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "Password@123"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "673f1c8b9d3e8a4a5c6d7e8f",
      "username": "alice",
      "email": "alice@example.com",
      "role": "user"
    }
  }
  ```

#### 3. User Profile (Protected)
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/auth/profile`
- **Header**: `Authorization: Bearer <YOUR_JWT_TOKEN>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Profile retrieved successfully.",
    "user": {
      "_id": "673f1c8b9d3e8a4a5c6d7e8f",
      "username": "alice",
      "email": "alice@example.com",
      "role": "user",
      "createdAt": "2026-11-21T17:30:00.000Z"
    }
  }
  ```

#### 4. Admin Dashboard (RBAC Protected)
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/auth/admin`
- **Header**: `Authorization: Bearer <ADMIN_JWT_TOKEN>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Welcome to the Admin Protected Area. Access granted.",
    "adminUser": {
      "id": "...",
      "username": "superadmin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "systemInfo": {
      "totalRegisteredUsers": 3,
      "serverTime": "2026-11-21T17:35:00.000Z"
    }
  }
  ```
- **When requested with `user` role (`403 Forbidden`)**:
  ```json
  {
    "success": false,
    "message": "Access forbidden: Insufficient privileges. Required role: [admin], your role: [user]."
  }
  ```

---

### B. Secure Notes Endpoints (`/api/notes`)

*All Note endpoints require `Authorization: Bearer <TOKEN>`.*

#### 1. Create a Note
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/notes`
- **Body**:
  ```json
  {
    "title": "Database Architecture",
    "content": "Use indexed emails, separate note schemas, and user ownership validation."
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Note created successfully.",
    "data": {
      "_id": "673f2a1b9d3e8a4a5c6d9999",
      "title": "Database Architecture",
      "content": "Use indexed emails, separate note schemas, and user ownership validation.",
      "owner": "673f1c8b9d3e8a4a5c6d7e8f",
      "createdAt": "2026-11-21T17:31:00.000Z",
      "updatedAt": "2026-11-21T17:31:00.000Z"
    }
  }
  ```

#### 2. Get All Notes (User's Own Notes)
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/notes`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "673f2a1b9d3e8a4a5c6d9999",
        "title": "Database Architecture",
        "content": "...",
        "owner": "673f1c8b9d3e8a4a5c6d7e8f",
        "createdAt": "2026-11-21T17:31:00.000Z"
      }
    ]
  }
  ```

#### 3. Get Individual Note
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/notes/:id`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "673f2a1b9d3e8a4a5c6d9999",
      "title": "Database Architecture",
      "content": "...",
      "owner": "673f1c8b9d3e8a4a5c6d7e8f"
    }
  }
  ```

#### 4. Update Note
- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/notes/:id`
- **Body**:
  ```json
  {
    "title": "Database Architecture (Final)",
    "content": "Verified and production-ready."
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Note updated successfully.",
    "data": { ... }
  }
  ```

#### 5. Delete Note
- **Method**: `DELETE`
- **URL**: `http://localhost:3000/api/notes/:id`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Note deleted successfully.",
    "data": {
      "id": "673f2a1b9d3e8a4a5c6d9999",
      "title": "Database Architecture (Final)"
    }
  }
  ```

---

## 8. Socket.IO Real-Time Chat Testing

### Testing via the Built-in Web Client
1. Start the server (`npm start`).
2. Open two separate browser tabs at:
   `http://localhost:3000`
3. On Tab 1:
   - Name: `Alice`
   - Room: `general`
   - Click **Join Room**
4. On Tab 2:
   - Name: `Bob`
   - Room: `general`
   - Click **Join Room**
5. Send a message from Tab 1. Tab 2 receives the message instantly without refreshing!

### Socket.IO Event Specification
- **`join_room`** (Client -> Server):
  Payload: `{ "username": "Alice", "room": "dev-chat" }`
- **`send_message`** (Client -> Server):
  Payload: `{ "room": "dev-chat", "sender": "Alice", "message": "Hello everyone!" }`
- **`receive_message`** (Server -> All Clients in room):
  Payload: `{ "sender": "Alice", "message": "Hello everyone!", "room": "dev-chat", "timestamp": "2026-11-21T17:35:00.000Z" }`
- **`disconnect`** (Client <-> Server):
  Automatically logged on server; leaves joined rooms.

---

## 9. Node.js EventEmitter Events

EventEmitter operates asynchronously in the background and is separate from Socket.IO:

| Event Name | Trigger Condition | Logged Attributes |
|---|---|---|
| `user_registered` | Upon successful `POST /api/auth/signup` | User ID, username, email, role, timestamp |
| `user_logged_in` | Upon successful `POST /api/auth/login` | User ID, username, email, role, timestamp |
| `note_created` | Upon successful `POST /api/notes` | Note ID, title, owner ID, timestamp |
| `note_deleted` | Upon successful `DELETE /api/notes/:id` | Note ID, title, owner ID, timestamp |

Console output example:
```text
[EVENT: USER_REGISTERED] [2026-11-21T17:30:10.123Z] New user account registered:
  - User ID  : 673f1c8b9d3e8a4a5c6d7e8f
  - Username : alice
  - Email    : alice@example.com
  - Role     : user

[EVENT: USER_LOGGED_IN] [2026-11-21T17:30:25.456Z] User logged in successfully:
  - User ID  : 673f1c8b9d3e8a4a5c6d7e8f
  - Username : alice
  - Email    : alice@example.com
  - Role     : user
```

---

## 10. Postman Testing Guide

1. Open Postman.
2. Click **Import** (top left).
3. Select `postman_collection.json` located in the root of this project.
4. The imported collection contains all 14 scenarios ordered with automatic JWT token extraction.
5. Simply execute the requests sequentially:
   - **Signup** -> **Login** (saves token into collection variable `authToken`)
   - **Notes CRUD** (uses `{{authToken}}` automatically)
   - **Access Control & RBAC** tests

---

## 11. Security Checklist Implemented

- [x] Passwords hashed with `bcrypt` (10 rounds) before saving to MongoDB.
- [x] Passwords excluded by default from queries and `toJSON` transforms.
- [x] JWT signed using secret key stored in `.env`.
- [x] `req.user` verified on every protected request.
- [x] Role-Based Access Control (`roleMiddleware.js`) enforcing `admin` authorization.
- [x] Notes strictly bound to user ownership (`note.owner.toString() === req.user._id.toString()`).
- [x] Cross-user access blocked with `403 Forbidden`.
- [x] Invalid MongoDB ObjectIds caught and returned with `400 Bad Request`.
- [x] Full error handling middleware preventing uncaught crashes.

