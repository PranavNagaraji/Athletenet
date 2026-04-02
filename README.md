# AthleteNet

AthleteNet is a full-stack sports management platform built to connect athletes, coaches, and clubs in one shared digital workspace. The application supports role-based dashboards, club discovery, team management, training sessions, performance tracking, playground bookings, tournaments, social feed activity, tactical formations, invitations, join requests, and real-time chat.

The project is organized as a MERN-style application with a React/Vite frontend and an Express/MongoDB backend.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Backend API Overview](#backend-api-overview)
- [Real-Time Chat](#real-time-chat)
- [File Uploads](#file-uploads)
- [Development Notes](#development-notes)

## Overview

AthleteNet is designed for sports communities where clubs need to manage people, athletes need access to opportunities, and coaches need tools to organize performance and training. Instead of splitting these workflows across separate apps, AthleteNet brings them together through three connected role experiences:

- Athletes can discover clubs, join teams, book playgrounds, view events, follow tournaments, receive invites, chat, and track assigned tasks.
- Coaches can join clubs, manage training sessions, evaluate athlete performance, create events, work with teams, build tactical formations, and communicate with athletes or clubs.
- Clubs can maintain profiles, manage athletes and coaches, approve join requests, create teams, publish tournaments, manage playgrounds, handle bookings, scout talent, and post updates.

Authentication is cookie-based, with role authorization applied to protected routes on the backend.

## Key Features

- Role-based authentication for athletes, coaches, and clubs
- Separate dashboards and layouts for each role
- Athlete and coach profile management
- Club profile management and club discovery
- Join request flow for athletes and coaches
- Club invitation flow for athletes and coaches
- Team creation and member assignment
- Athlete and coach team joining
- Training session creation, updates, deletion, and attendance tracking
- Coach-created events visible to athletes
- Athlete performance rating tools for coaches
- Playground creation and nearby playground discovery
- Playground booking, cancellation, slot lookup, and slot blocking
- Tournament creation, joining, member viewing, and management
- Club and user feed posts with likes and comments
- Real-time group and direct messaging with Socket.IO
- Team, club, tournament, and direct chat support
- Tactical formation creation, editing, detail pages, and comments
- Image upload support for profile pictures, posts, and related media
- Light/dark theme context on the frontend

## User Roles

### Athlete

Athletes can use AthleteNet to find clubs, manage their sports profile, send join requests, accept or reject invites, join teams, view coach events, book playgrounds, participate in tournaments, follow feeds, view assigned tasks, and communicate through chat.

Main athlete pages include:

- Dashboard
- Profile
- Clubs
- Joined Clubs
- Requests
- Invites
- Teams
- Playgrounds
- Bookings
- Feed
- Tournaments
- Tasks
- Events
- Tactics
- Chat

### Coach

Coaches can manage their coaching profile, connect with clubs, join teams, run training sessions, rate athlete performance, create events, manage tactical formations, review requests and invites, and collaborate through chat.

Main coach pages include:

- Dashboard
- Profile
- Clubs
- Joined Clubs
- Teams
- Requests
- Training
- Performance
- Events
- Athletes
- Invites
- Tasks
- Tactics

### Club

Clubs act as organization accounts. They can manage club details, review incoming join requests, invite athletes or coaches, create teams, manage playgrounds, handle bookings, publish tournaments, view members, scout talent, maintain a club feed, and chat with members.

Main club pages include:

- Dashboard
- Profile
- Members
- Join Requests
- Teams
- Playgrounds
- Bookings
- Tournaments
- Talent
- Feed
- Chat

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios and Fetch API
- Socket.IO Client
- Leaflet and React Leaflet
- Lucide React icons
- Tailwind CSS
- React Zoom Pan Pinch

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JSON Web Tokens
- bcrypt
- cookie-parser
- CORS
- Multer
- dotenv

## Project Structure

```text
Athletenet/
|-- backend/
|   |-- src/
|   |   |-- config/          # MongoDB connection
|   |   |-- controllers/     # Request handlers and business logic
|   |   |-- middleware/      # Auth and role protection
|   |   |-- models/          # Mongoose schemas
|   |   |-- routes/          # Express route definitions
|   |   |-- utils/           # JWT and upload helpers
|   |   |-- server.js        # Express app and HTTP server
|   |   `-- socket.js        # Socket.IO event handling
|   |-- uploads/             # Uploaded media files
|   `-- package.json
|
|-- frontend/
|   |-- public/              # Static frontend assets
|   |-- src/
|   |   |-- components/      # Shared UI components
|   |   |-- context/         # Auth and theme providers
|   |   |-- lib/             # Frontend constants and presets
|   |   |-- pages/           # Role-based pages
|   |   |   |-- athlete/
|   |   |   |-- club/
|   |   |   `-- coach/
|   |   |-- routes/          # Protected/public route wrappers
|   |   |-- utils/           # Frontend utilities
|   |   |-- App.jsx          # Main route map
|   |   `-- main.jsx         # React entry point
|   `-- package.json
|
`-- README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- MongoDB, either local MongoDB or MongoDB Atlas

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Athletenet
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside `backend/` and another inside `frontend/`.

Backend example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/athletenet
JWT_SECRET=replace_with_a_strong_secret
FRONTENDURL=http://localhost:5173
```

Frontend example:

```env
VITE_BACKEND_URL=http://localhost:5000
```

### 5. Run the Backend

```bash
cd backend
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 6. Run the Frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

The frontend usually runs on:

```text
http://localhost:5173
```

## Environment Variables

### Backend

| Variable | Description |
| --- | --- |
| `PORT` | Port for the Express and Socket.IO server. Defaults to `5000` if not set. |
| `MONGODB_URI` | MongoDB connection string used by Mongoose. |
| `JWT_SECRET` | Secret key used to sign authentication tokens. |
| `FRONTENDURL` | Allowed frontend origin for CORS and Socket.IO. |

### Frontend

| Variable | Description |
| --- | --- |
| `VITE_BACKEND_URL` | Backend API base URL used by frontend requests. |

## Available Scripts

### Backend

Run the backend in development mode with Nodemon:

```bash
npm run dev
```

Run the backend in production mode:

```bash
npm start
```

### Frontend

Run the Vite development server:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run ESLint:

```bash
npm run lint
```

## Backend API Overview

The backend exposes REST endpoints under `/api`.

| Base Route | Purpose |
| --- | --- |
| `/api/auth` | Signup, login, logout, and current user lookup |
| `/api/user` | User-related actions |
| `/api/athlete` | Athlete profile, nearby clubs, join requests, events, and performance |
| `/api/coach` | Coach profile, teams, events, performance ratings, and coach tools |
| `/api/club` | Club profile, club listing, members, followers, and club lookup |
| `/api/join-request` | Join request creation, approval, and rejection |
| `/api/invite` | Club invitations for athletes and coaches |
| `/api/team` | Team creation, updates, membership, and team lookup |
| `/api/playground` | Playground creation, update, discovery, and status management |
| `/api/booking` | Playground bookings, available slots, blocking, and cancellation |
| `/api/tournament` | Tournament creation, joining, listing, and member lookup |
| `/api/competition` | Competition route mounted to tournament logic |
| `/api/post` | Feed posts, likes, and comments |
| `/api/training` | Training sessions and attendance |
| `/api/formations` | Tactical formations and formation comments |
| `/api/chat` | Stored chat message history |
| `/api/upload` | Image upload endpoint |

## Real-Time Chat

AthleteNet uses Socket.IO for live messaging. The backend initializes a WebSocket server on the same HTTP server as Express.

Supported chat room patterns include:

- Club group rooms
- Team group rooms
- Tournament group rooms
- Direct message rooms

Messages are stored in MongoDB through the `Message` model and then broadcast to the active Socket.IO room.

## File Uploads

The backend uses Multer for image uploads. Uploaded files are saved in:

```text
backend/uploads/
```

Uploaded files are served statically from:

```text
/uploads/<filename>
```

The upload API returns a relative file URL that can be combined with the backend URL on the frontend.

## Development Notes

- The backend uses HTTP-only cookies for authentication.
- Protected backend routes use `protect` and role-specific authorization through `authorize(...)`.
- The frontend route map is defined in `frontend/src/App.jsx`.
- Role-aware route protection is handled through `AuthRoute` and `PublicRoute`.
- Uploaded media files are currently stored locally in the backend `uploads/` directory.
- The repository currently contains separate `package.json` files for frontend and backend, so dependencies must be installed in both folders.
- If authentication cookies do not persist during local HTTP development, review the cookie settings in `backend/src/utils/token.js`, especially `secure` and `sameSite`.

## Future Improvements

- Add automated tests for backend controllers and frontend role flows
- Add API documentation with request and response examples
- Add seed data for faster local development
- Add production deployment instructions
- Move uploaded files to cloud storage for production use
- Add stronger validation for API payloads
- Add centralized error handling middleware
