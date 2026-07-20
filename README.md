# 🌌 Cosmic Explorer AI

> A production-level 3D AI Astronomy GPT Platform — powered by NASA data, OpenAI, Three.js, and Next.js.

![Cosmic Explorer AI](https://images-assets.nasa.gov/image/PIA23645/PIA23645~thumb.jpg)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Chatbot | GPT-4o powered astronomy assistant |
| 🪐 3D Space | React Three Fiber planets, black holes, nebulae |
| 🛰️ NASA APIs | APOD, Image Library, Mars rover, exoplanets |
| 🎙️ Voice | Speech-to-text + TTS in 5+ languages |
| 📷 Image Analysis | Upload & AI-analyze astronomy photos |
| 💬 Chat History | Persistent sessions with rename/delete |
| 🔐 Auth | JWT + bcrypt secure accounts |
| 🌐 i18n | English, Hindi, Telugu, Spanish |

---

## 🏗️ Architecture

```
cosmic-explorer/
├── frontend/          # Next.js 14 + TypeScript + Tailwind
│   └── src/
│       ├── app/       # Pages (/, /login, /dashboard, /about)
│       ├── components/# Sidebar, Chat, 3D, NASA, Voice, Upload
│       ├── context/   # AuthContext
│       └── services/  # API, Chat, NASA, Upload services
├── backend/           # Node.js + Express
│   └── src/
│       ├── models/    # User, Chat, UploadedImage (Mongoose)
│       ├── controllers/# Auth, Chat, NASA, Upload
│       ├── routes/    # /api/auth /api/chats /api/nasa /api/uploads
│       ├── services/  # aiService, nasaService
│       └── middleware/# JWT auth
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key
- NASA API key (free at [api.nasa.gov](https://api.nasa.gov))
- Cloudinary account (free)

### 1. Clone & Install

```bash
# Backend
cd cosmic-explorer/backend
cp .env.example .env
# Fill in your API keys in .env
npm install
npm run dev   # Runs on http://localhost:5000

# Frontend (new terminal)
cd cosmic-explorer/frontend
cp .env.local.example .env.local
npm install
npm run dev   # Runs on http://localhost:3000
```

### 2. Docker Compose (all-in-one)

```bash
cd cosmic-explorer
cp backend/.env.example .env
# Fill in .env with your keys
docker-compose up --build
```

Open `http://localhost:3000` 🚀

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random secret (min 32 chars) |
| `OPENAI_API_KEY` | OpenAI API key (`sk-...`) |
| `NASA_API_KEY` | NASA API key (free) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:5000`) |

---

## ☁️ Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
# Set NEXT_PUBLIC_API_URL to your backend URL
```

### Backend → Render / Railway

1. Create a new Web Service
2. Connect your GitHub repo
3. Set root directory to `cosmic-explorer/backend`
4. Add all environment variables
5. Build command: `npm install`
6. Start command: `npm start`

### Database → MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Add your backend server IP to Network Access
3. Copy the connection string into `MONGODB_URI`

---

## 🛠️ Tech Stack

**Frontend:** Next.js 14 · TypeScript · Tailwind CSS · Three.js · React Three Fiber · Framer Motion · Zustand  
**Backend:** Node.js · Express · Mongoose · JWT · bcryptjs · Multer  
**AI:** OpenAI GPT-4o · Vision API  
**Storage:** MongoDB Atlas · Cloudinary  
**APIs:** NASA APOD · NASA Image Library · NASA Exoplanet Archive · Mars Rover Photos  
**DevOps:** Docker · Docker Compose · Vercel · Render  

---

## 📂 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/chats` | ✅ | List chats |
| POST | `/api/chats` | ✅ | New chat |
| POST | `/api/chats/:id/messages` | ✅ | Send message (AI) |
| DELETE | `/api/chats/:id` | ✅ | Delete chat |
| GET | `/api/nasa/apod` | ✅ | NASA APOD |
| GET | `/api/nasa/images?q=mars` | ✅ | NASA image search |
| GET | `/api/nasa/mars` | ✅ | Mars rover photos |
| POST | `/api/uploads` | ✅ | Upload image |
| GET | `/api/uploads` | ✅ | My images |
| GET | `/api/health` | ❌ | Health check |

---

## 📄 License

MIT License — Build the universe, share the knowledge.

---

*Made with ❤️ for astronomy enthusiasts everywhere.*
