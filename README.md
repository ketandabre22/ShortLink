# URL Shortener (Production-Ready)

Full-stack URL shortener with JWT auth, MongoDB, click analytics, optional custom slugs, expiry, QR codes, and rate limiting.

## Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, Recharts, Axios  
- **Backend:** Node.js, Express, Mongoose, JWT, bcrypt, nanoid, express-rate-limit, qrcode  
- **Database:** MongoDB  

## Prerequisites

- Node.js **18+**
- A running **MongoDB** instance (local or Atlas)

## 1. Clone / open the project

```bash
cd URLShortner
```

## 2. Backend setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

- `MONGODB_URI` — your MongoDB connection string  
- `JWT_SECRET` — long random string (**≥32 characters** recommended)  
- `BASE_URL` — public base URL of the API (used in generated short links), e.g. `http://localhost:5000`  
- `CLIENT_URL` — frontend origin for CORS, e.g. `http://localhost:5173`  

Install and run:

```bash
npm install
npm run dev
```

The API listens on `http://localhost:5000` (or `PORT` from `.env`).

**Scripts (as required):**

- `npm run dev` — `nodemon -r dotenv/config src/index.js`  
- `npm start` — `node -r dotenv/config src/index.js`  

## 3. Frontend setup

In a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API calls are proxied to the backend in development.

## 4. Production build (frontend)

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` folder with any static host or put it behind nginx. Point `CLIENT_URL` and CORS to your real frontend URL. Set `BASE_URL` to the **public URL where redirects are served** (same host as the API if you deploy API + redirect on one domain).

## API (REST)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register; returns JWT |
| POST | `/api/auth/login` | No | Login; returns JWT |
| POST | `/api/auth/logout` | No | Symmetric logout (client should discard token) |
| POST | `/api/url/shorten` | Yes | Body: `url`, optional `customCode`, `expiresAt` (ISO) |
| GET | `/api/url/:code` | No | Metadata for a short code |
| GET | `/api/url/user/all` | Yes | List current user’s URLs |
| DELETE | `/api/url/:id` | Yes | Delete URL (MongoDB `_id`) |
| GET | `/api/url/analytics/:id` | Yes | Analytics; query `?days=30` |
| GET | `/:code` | No | **302 redirect** to original URL; tracks click |

Health: `GET /health`

## Features

- Password hashing (bcrypt)  
- JWT Bearer auth  
- Unique short codes (nanoid); optional **custom** slug  
- Optional **link expiry**  
- **Click count** + **ClickEvent** documents with timestamp, IP, user-agent  
- Analytics: total clicks + **clicks over time** (aggregated by day)  
- **QR code** (data URL) returned on shorten  
- **Rate limiting** on auth, shorten, and general API  
- HTML error pages for invalid/expired redirect links  

## Project layout

```
backend/src
  config/       # db, env validation
  controllers/  # auth, url + redirect
  models/       # User, Url, ClickEvent
  routes/
  middleware/   # auth, errors, rate limits
  utils/
  index.js

frontend/src
  api/
  components/
  context/
  pages/
```

## Security notes

- Use a strong `JWT_SECRET` in production.  
- Prefer HTTPS in production.  
- Rate limits are basic; add CAPTCHA or account lockout for stricter auth hardening if needed.  
# ShortLink
