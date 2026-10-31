# Chatbox

Chatbox is a real-time messaging application with direct messages, chat rooms, typing indicators, unread-message tracking, and JWT-based authentication.

## Features

- User registration and login
- JWT-protected REST API and Socket.IO connections
- Direct messages with conversation history
- Public chat rooms with message history
- User search by username or email
- Typing indicators and online/offline notifications
- Unread message counts and read-state tracking
- React and Tailwind CSS interface

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Socket.IO
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT and bcrypt
- **Deployment:** Multi-stage Dockerfiles with Nginx for the frontend

## Project structure

```text
.
├── backend/
│   ├── src/
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # REST API routes
│   │   ├── socket/       # Socket.IO auth and message handlers
│   │   └── server.ts
│   └── .Dockerfile
└── frontend/
    ├── src/
    │   ├── context/      # Auth and Socket.IO providers
    │   ├── pages/        # Application pages
    │   └── components/   # UI components
    └── .Dockerfile
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB (local or hosted)

## Configuration

Create `backend/.env`:

```env
PORT=5000
MONGOURI=mongodb://127.0.0.1:27017/chatbox
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

The frontend development server proxies `/api` requests to `http://localhost:5000` and connects to Socket.IO at the same address.

## Local development

Install dependencies and start the backend:

```bash
cd backend
npm install
npm run dev
```

In a second terminal, install dependencies and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production builds

Build the backend:

```bash
cd backend
npm run build
node dist/server.js
```

Build and preview the frontend:

```bash
cd frontend
npm run build
npm run preview
```

## API

Unauthenticated routes:

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `GET` | `/health` | Check server health |

Authenticated routes use `Authorization: Bearer <token>`:

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/auth/me` | Get the current user |
| `GET` | `/api/messages/conversations` | List direct-message conversations |
| `GET` | `/api/messages/conversation/:username` | Get a direct-message history |
| `GET` | `/api/messages/room/:roomName` | Get room history |
| `GET` | `/api/messages/users/search?q=...` | Search for users |
| `GET` | `/api/messages/unread` | Get the unread-message count |
| `PUT` | `/api/messages/read/:username` | Mark messages from a user as read |

## Socket.IO events

Socket connections authenticate with the JWT in the handshake auth payload. The main client events are:

- `direct message`
- `get conversation`
- `join room`
- `room message`
- `leave room`
- `typing`
- `stop typing`

The server emits conversation history, room history, direct and room messages, typing state, notifications, and online/offline status updates.

## Docker

Build the backend image from the repository root:

```bash
docker build -f backend/.Dockerfile -t chatbox-backend backend
```

Build the frontend image:

```bash
docker build -f frontend/.Dockerfile -t chatbox-frontend frontend
```

The frontend image serves the built application with Nginx on port `80`. The backend image listens on port `5000` and requires the MongoDB and JWT environment variables shown above.

## License

This project currently uses the ISC license declared in `backend/package.json`.