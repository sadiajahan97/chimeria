# Chimeria

A full-stack AI-powered chat application featuring multimodal capabilities (text and image) using Google's Gemini AI. The application provides a spacecraft operations assistant interface where users can interact with an AI assistant that analyzes both textual queries and uploaded images to provide guidance and support.

## Architecture

### Technology Stack

**Backend:**

- **Framework**: FastAPI 0.122.0
- **Language**: Python 3.13
- **ORM**: Prisma (Python client)
- **Database**: PostgreSQL (Alpine)
- **Authentication**: JWT (PyJWT) with refresh token rotation
- **AI Integration**: Google Generative AI (Gemini 2.5 Flash)
- **Image Processing**: Pillow (PIL)
- **Password Hashing**: bcrypt
- **Server**: Uvicorn with ASGI

**Frontend:**

- **Framework**: Next.js 16.0.8
- **Language**: TypeScript 5
- **UI Library**: React 19.2.1
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack React Query 5.90.12
- **HTTP Client**: Axios 1.13.2
- **Form Handling**: React Hook Form 7.68.0
- **JWT Decoding**: jwt-decode 4.0.0

**Infrastructure:**

- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL Alpine
- **Volume Management**: Docker volumes for persistent data

## Project Structure

```
chimeria/
├── chimeria-backend/          # FastAPI backend application
│   ├── main.py                # Application entry point and FastAPI app configuration
│   ├── database.py            # Prisma database client initialization
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Backend container configuration
│   ├── entrypoint.sh          # Container entrypoint script
│   ├── middlewares/           # Custom middleware
│   │   └── auth.py            # JWT authentication middleware
│   ├── routers/               # API route handlers
│   │   ├── auth.py            # Authentication endpoints (sign-up, sign-in, sign-out, refresh)
│   │   ├── gemini.py          # Gemini AI integration endpoints
│   │   └── user.py            # User profile and message endpoints
│   ├── prisma/                # Prisma schema and migrations
│   │   ├── schema.prisma      # Database schema definition
│   │   └── migrations/        # Database migration history
│   └── utils.py               # Utility functions (image handling, etc.)
│
├── chimeria-frontend/         # Next.js frontend application
│   ├── app/                   # Next.js app directory
│   │   ├── page.tsx           # Main dashboard/chat interface
│   │   ├── layout.tsx          # Root layout component
│   │   ├── globals.css        # Global styles
│   │   ├── auth/              # Authentication pages
│   │   │   ├── page.tsx       # Auth page container
│   │   │   ├── layout.tsx     # Auth layout
│   │   │   └── components/    # Auth form components
│   │   ├── components/        # Reusable React components
│   │   │   ├── header.tsx     # Application header
│   │   │   ├── user-message.tsx
│   │   │   ├── assistant-message.tsx
│   │   │   └── query-client-provider.tsx
│   │   └── contexts/          # React contexts
│   │       └── profile.tsx    # User profile context
│   ├── api/                   # API client functions
│   │   └── index.ts           # Axios instance and API methods
│   ├── utils/                 # Frontend utilities
│   │   └── index.ts           # Helper functions
│   ├── package.json           # Node.js dependencies
│   ├── Dockerfile             # Frontend container configuration
│   ├── next.config.ts         # Next.js configuration
│   └── tsconfig.json          # TypeScript configuration
│
├── compose.yaml               # Docker Compose configuration
└── README.MD                  # This file
```

## Database Schema

### Models

**User**

- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `hashedPassword` (String)
- `name` (String)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- Relations: `sessions`, `messages`

**Session**

- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → User)
- `jti` (String, Unique) - JWT ID for token rotation
- `exp` (Int) - Expiration timestamp
- `remember` (Boolean) - Extended session flag
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Message**

- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → User)
- `content` (String) - Message text content
- `image` (String?, Optional) - Image file path
- `role` (String) - "user" or "assistant"
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## API Endpoints

### Authentication (`/auth`)

- `POST /auth/sign-up` - User registration

  - Body: `{ email: string, password: string, name: string }`
  - Returns: `{ message: string, accessToken: string }`
  - Sets HTTP-only refresh token cookie

- `POST /auth/sign-in` - User login

  - Body: `{ email: string, password: string, remember: boolean }`
  - Returns: `{ message: string, accessToken: string }`
  - Sets HTTP-only refresh token cookie

- `POST /auth/sign-out` - User logout

  - Deletes session and refresh token cookie
  - Returns: `{ message: string }`

- `POST /auth/refresh` - Refresh access token

  - Uses refresh token from cookie
  - Returns: `{ accessToken: string }`
  - Rotates refresh token (JTI)

- `GET /auth/check` - Verify authentication status
  - Returns: `{ authenticated: boolean, user: { id, email }, accessToken?: string }`

### Gemini AI (`/gemini`)

- `POST /gemini/ask` - Submit question with optional image
  - Headers: `Authorization: Bearer <access_token>`
  - Form Data:
    - `question` (string, required)
    - `file` (File, optional) - Image file (max 10MB)
  - Returns: `{ content: string, role: "assistant" }`
  - Stores both user message and assistant response in database

### User (`/user`)

- `GET /user/profile` - Get user profile

  - Headers: `Authorization: Bearer <access_token>`
  - Returns: `{ email: string, name: string }`

- `GET /user/messages` - Get user's message history
  - Headers: `Authorization: Bearer <access_token>`
  - Returns: `Array<{ content: string, image: string | null, role: string }>`
  - Messages ordered by creation time (ascending)

### Health Check

- `GET /` - Health check endpoint
  - Returns: `204 No Content`

## Authentication Flow

1. **Registration/Login**: User provides credentials → Server validates → Creates session → Returns access token + sets refresh token cookie
2. **Access Token**: Short-lived (15 minutes), used for API requests
3. **Refresh Token**: Long-lived (1 day default, 30 days if "remember me"), stored in HTTP-only cookie
4. **Token Rotation**: On refresh, new JTI is generated and old session is updated
5. **Session Management**: Sessions tracked in database with JTI for revocation

## Environment Variables

### Backend (`.env` in `chimeria-backend/`)

```env
DATABASE_URL=postgres://postgres:p0stgr3s@db:5432/yolo
GEMINI_API_KEY=your_gemini_api_key_here
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
```

### Frontend

- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (set via Docker build arg)

## Setup & Installation

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.13+ (for local development)

### Docker Deployment

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chimeria
   ```

2. **Configure environment variables**

   - Create `chimeria-backend/.env` file:
     ```env
     DATABASE_URL=postgres://postgres:p0stgr3s@db:5432/yolo
     GEMINI_API_KEY=your_gemini_api_key
     ACCESS_TOKEN_SECRET=your_secret_key_here
     REFRESH_TOKEN_SECRET=your_secret_key_here
     ```

3. **Build and start services**

   ```bash
   docker compose up --build
   ```

4. **Run database migrations**

   ```bash
   docker compose exec api prisma migrate deploy
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development

#### Backend

1. **Navigate to backend directory**

   ```bash
   cd chimeria-backend
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Prisma**

   ```bash
   prisma generate
   prisma migrate dev
   ```

5. **Configure environment variables** (create `.env` file)

6. **Run development server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend

1. **Navigate to frontend directory**

   ```bash
   cd chimeria-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment** (create `.env.local`):

   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## Features

### Core Functionality

- **User Authentication**: Secure registration, login, logout with JWT-based session management
- **Multimodal AI Chat**: Text and image-based queries to Gemini AI
- **Message History**: Persistent storage and retrieval of conversation history
- **Image Upload**: Support for image uploads (max 10MB) with preview
- **Session Management**: Secure token rotation and session tracking

### AI Assistant Characteristics

The application uses a specialized prompt for "Mission Control AI" - a spacecraft operations assistant that:

- Provides calm, authoritative guidance
- Analyzes both text and images
- Offers step-by-step instructions
- Prioritizes safety and mission-critical information
- Uses simple, non-technical language

## Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Authentication**: Access and refresh token pattern
- **HTTP-Only Cookies**: Refresh tokens stored securely
- **Token Rotation**: JTI-based refresh token rotation
- **CORS Configuration**: Restricted to frontend origin
- **Input Validation**: Pydantic models for request validation
- **File Upload Validation**: Image type and size restrictions

## Docker Services

### `api` (Backend)

- Port: `8000`
- Health check: HTTP GET `/`
- Depends on: `db` (healthy)
- Volumes: `img:/app/images` (for image storage)

### `app` (Frontend)

- Port: `3000`
- Depends on: `api` (started)
- Build arg: `BACKEND_URL`

### `db` (PostgreSQL)

- Port: `5432` (internal)
- Database: `yolo`
- User: `postgres`
- Password: `p0stgr3s`
- Health check: `pg_isready`

## Development Notes

### Database Migrations

Migrations are managed through Prisma:

```bash
# Create new migration
prisma migrate dev --name migration_name

# Apply migrations in production
prisma migrate deploy
```

### Image Storage

Uploaded images are stored in `/app/images` (Docker volume `img`). The path is stored in the database, and images are served as data URLs when retrieved.

### CORS Configuration

Currently configured for `http://localhost:3000`. Update `main.py` for production deployment.
