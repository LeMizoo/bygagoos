# ByGagoos Ink - Copilot Instructions

## Project Overview
Full-stack e-commerce/business management application for a Malagasy screen printing company. Node.js/Express backend (Prisma + MongoDB), React + Vite frontend. Deployed on Vercel (production) and Docker (local).

---

## Architecture

### Backend (Node.js/Express) - Port 3002
- **Entry point**: [backend/app.js](../backend/app.js)
- **Routing pattern**: Express routers mounted at `/api/*` endpoints
- **Authentication**: JWT tokens stored in `Authorization: Bearer {token}` header
- **Database**: MongoDB via Prisma ORM ([backend/prisma/schema.prisma](../backend/prisma/schema.prisma))
- **Middleware stack**: CORS (configurable origins), Helmet security, rate limiting, validation
- **Key routes**:
  - `/api/auth/login`, `/api/auth/register`
  - `/api/users`, `/api/products`, `/api/orders`, `/api/clients`, `/api/stock`
  - `/api/health` - deployment health check
- **Error handling**: Status codes + JSON error messages. 401 = token issues, 403 = insufficient permissions

### Frontend (React + Vite) - Port 5173
- **Entry point**: [frontend/src/App.jsx](../frontend/src/App.jsx) with React Router
- **Auth context**: [frontend/src/context/AuthContext.jsx](../frontend/src/context/AuthContext.jsx) - manages login/logout, localStorage persistence (`bygagoos_token`, `bygagoos_user`)
- **API client**: [frontend/src/services/api.js](../frontend/src/services/api.js) - axios with auto Bearer token injection + 401 redirect to `/login`
- **Route structure**: Public `/` routes + Protected `/admin/*` + `/client/*` routes via `<PrivateRoute>`
- **Layouts**: `PublicLayout` (navbar + footer) vs `AdminLayout` (sidebar navigation)
- **Styling**: CSS modules per component (e.g., [DevPageGuard.css](../frontend/src/components/DevPageGuard.css)), global [index.css](../frontend/src/index.css)

---

## Data Model (Prisma/MongoDB)
```
User (auth roles: "admin", "user")
  ├─ email (unique)
  ├─ password (hashed via bcryptjs)
  ├─ role (default: "user")
  └─ orders []

Product
  ├─ name, description, price, stock
  ├─ category, image URL
  └─ timestamps

Order
  ├─ userId → User
  ├─ items (JSON: [{productId, name, quantity, price}])
  ├─ status ("pending" → "confirmed" → "shipped" → "delivered")
  ├─ total, paymentMethod ("cash" etc)
  └─ timestamps
```

---

## Authentication & Authorization

### Backend
- **Login flow**: POST `/api/auth/login` → validate credentials → JWT sign → return `{token, user}`
- **Demo credentials**: 
  - User: `demo@bygagoos.mg` / `demo123`
  - Admin: `admin@bygagoos.mg` / `Admin@2024`
- **Middleware**: `verifyToken` (401 if missing/invalid), `isAdmin` (403 if not admin)
- **Token expiry**: 24h default (env: `JWT_EXPIRES_IN`)

### Frontend
- **Token storage**: localStorage with keys `bygagoos_token`, `bygagoos_user` (JSON string)
- **Route protection**: `<PrivateRoute>` component checks `useAuth()` hook
- **Auto-logout**: 401 responses trigger redirect to `/login`
- **Role-based**: Admin pages at `/admin/*`, client pages at `/client/*`

---

## Key Workflows

### Local Development
```bash
# Terminal 1: Backend
cd backend
npm run dev  # nodemon on app.js

# Terminal 2: Frontend
cd frontend
npm run dev  # Vite dev server

# Verify:
curl http://localhost:3002/api/health
open http://localhost:5173
```

### Database
```bash
# Prisma commands (run from backend/)
npx prisma db push          # sync schema to MongoDB
npx prisma studio          # GUI for data exploration
npx prisma generate        # regenerate Prisma client
```

### Docker
```bash
docker-compose up           # All services (mongo, backend, frontend)
docker-compose down -v      # Stop + remove volumes
```

### Production
- Backend: Vercel `/api` serverless deployment, env vars include `DATABASE_URL`, `JWT_SECRET`
- Frontend: Vercel SPA build
- Health check: `https://bygagoos-api.vercel.app/api/health`

---

## Code Patterns & Conventions

### API Route Pattern
```javascript
// backend/routes/[resource].js
const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // fetch from DB or service
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
  // admin-only endpoint
});

module.exports = router;
```

### React Component Pattern
```jsx
// Hooks: useAuth() for auth state, useState for local
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function MyPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/endpoint').then(r => setData(r.data)).catch(console.error);
  }, []);

  return <div>{/* render */}</div>;
}
```

### Error Handling
- **Backend**: Return JSON `{error: "message"}` with appropriate status codes
- **Frontend**: Catch API errors, display via toast (react-hot-toast) or inline error state
- **No console.log in production**: Use winston logger (already configured in backend)

### File Uploads
- **Handler**: [backend/middleware/upload.js](../backend/middleware/upload.js) uses Multer
- **Destination**: `/backend/public/uploads/` (mounted at `/public` endpoint)
- **Frontend**: POST multipart/form-data to `/api/uploads` endpoint

---

## Project-Specific Notes

1. **Bilingual**: UI/docs mix French & English (e.g., "Erreur de connexion")
2. **Stateless auth**: No session cookies; JWT + localStorage only
3. **Environment config**: All env vars read from `.env` at runtime (dotenv)
4. **Modular routes**: New resource? Add route file, mount in [backend/app.js](../backend/app.js) with try/catch
5. **Component organization**: Features grouped by page route (e.g., `admin/orders/OrdersPage.jsx`)
6. **Timestamps**: Prisma auto-manages `createdAt`/`updatedAt` (map to `created_at`/`updated_at` in MongoDB)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Token missing" 401 | Ensure axios interceptor adds Bearer header via `localStorage.getItem('bygagoos_token')` |
| CORS errors | Update `ALLOWED_ORIGINS` env var in backend |
| Prisma client stale | Run `npx prisma generate` after schema edits |
| Port 3002/5173 in use | `kill -9 <pid>` or `docker-compose down` |
| MongoDB auth failure | Check `DATABASE_URL` credentials match docker-compose `MONGO_INITDB_ROOT_*` vars |

---

## Key Directories

- [backend/routes](../backend/routes) - API route handlers
- [backend/middleware](../backend/middleware) - Auth, validation, error handling
- [frontend/src/pages](../frontend/src/pages) - Page components (organized by admin/client/public)
- [frontend/src/components](../frontend/src/components) - Reusable UI components
- [backend/prisma](../backend/prisma) - Data schema definition
- [docs](../docs) - User documentation

---

## External References
- **Vercel URLs**: https://bygagoos-ink.vercel.app (frontend), https://bygagoos-api.vercel.app/api (backend)
- **Stack**: Express.js, React 18, Prisma 5, MongoDB, Vite, JWT auth
