# Blue Moon Codebase - AI Agent Instructions

## Project Overview
Blue Moon is a **full-stack apartment management system** with a **React + Vite frontend** (`blue-moon-fe`) and a **Node.js + Express backend** (`blue-moon-backend`). It manages household data, residents, vehicles, receipts, and user authentication.

## Architecture

### Frontend (`blue-moon-fe`)
- **Stack**: React 19 + Vite + Axios
- **Port**: 5173 (dev), built via `npm run build`
- **Build Tool**: Vite with React plugin (no SWC/compiler enabled)
- **Styling**: CSS modules in `src/`
- **API Communication**: Axios calls to `http://localhost:3000/api/*`
- **Key Files**: [App.jsx](blue-moon-fe/src/App.jsx) contains the main component structure

### Backend (`blue-moon-backend`)
- **Stack**: Express.js 5.2 + MySQL 3.15 + JWT authentication
- **Port**: 3000 (from `process.env.PORT`)
- **Database**: MySQL with promise-based pool (`mysql2/promise`)
- **Entry Point**: [server.js](blue-moon-backend/blue-moon-backend/server.js)
- **Routes**: Modular in `/routes/` (auth, hogiadinh, nhankhau, xeco, phieuthu)

## Critical Developer Workflows

### Frontend Development
```bash
cd blue-moon-fe
npm install
npm run dev      # Start dev server with HMR
npm run build    # Production build (outputs to dist/)
npm run lint     # ESLint check (ignores dist/)
```

### Backend Development
```bash
cd blue-moon-backend/blue-moon-backend
npm install
npm start        # Runs server.js on port 3000
```
**Important**: Backend requires `.env` file with: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_PORT`, `JWT_SECRET`

### Database Setup
- Execute [sql/auth_schema.sql](blue-moon-backend/blue-moon-backend/sql/auth_schema.sql) to create tables
- Test users: admin (password123), user1 (password123)
- Run `migrate-auth.js` if reinitializing auth system

## Project-Specific Patterns

### Authentication & Security
1. **JWT Flow**:
   - `POST /api/auth/register` → Create user with bcryptjs-hashed password
   - `POST /api/auth/login` → Returns JWT token (24-hour expiry)
   - `GET /api/auth/verify` → Validate token
   - All POST/PUT/DELETE endpoints require `Authorization: Bearer <token>` header

2. **Middleware** ([middleware/auth.js](blue-moon-backend/blue-moon-backend/middleware/auth.js)):
   - `verifyToken`: Validates JWT, attaches `req.user` with {id, username, role}
   - `requireRole(role)`: Optional role-based access control
   - 401 errors for missing tokens, 403 for invalid/expired tokens

### Input Validation & Sanitization
**Reusable utilities in [server.js](blue-moon-backend/blue-moon-backend/server.js) and route files**:
```javascript
const isValidId = (id) => !isNaN(id) && id > 0;
const isValidString = (str) => typeof str === 'string' && str.trim().length > 0;
const sanitizeInput = (str) => isValidString(str) ? str.trim() : null;
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```
Use `asyncHandler()` to wrap all async route handlers and centralize error handling.

### Database Patterns
- **Exports**: [db.js](blue-moon-backend/blue-moon-backend/db.js) exports the pool directly (NOT destructured)
- **Queries**: Always use parameterized queries: `pool.query('SELECT * FROM Table WHERE id = ?', [id])`
- **Return Format**: `const [rows] = await pool.query(...)` (destructure from mysql2/promise)

### API Response Pattern
```javascript
// Success
res.status(201).json({ message: '...', data: {...}, count: rows.length });

// Error
res.status(400).json({ message: 'Error description' });
```

### Frontend-Backend Integration
- Frontend at `http://localhost:3000/api/*` endpoints
- All API calls go through Axios with error handling
- [App.jsx](blue-moon-fe/src/App.jsx) demonstrates fetching users on mount with error display

## Naming & Conventions
- **Vietnamese field names**: Database uses Vietnamese column names (ten_chu_ho, ma_can_ho, etc.) - preserve these
- **Route pattern**: Entity-based routes like `/api/hogiadinh`, `/api/nhankhau`
- **Camel case** in JavaScript, snake_case in SQL column names
- **Comments in English** for code explanations, Vietnamese for UI/error messages

## Cross-Component Communication
- **Frontend → Backend**: Axios HTTP requests with JWT token in Authorization header
- **Backend → Database**: mysql2 promise pool with parameterized queries
- **Error Propagation**: asyncHandler catches promise rejections and passes to Express error middleware
- **CORS**: Enabled in [server.js](blue-moon-backend/blue-moon-backend/server.js) for cross-origin requests

## Key Files Reference
| Purpose | File |
|---------|------|
| Backend entry | [server.js](blue-moon-backend/blue-moon-backend/server.js) |
| Database pool | [db.js](blue-moon-backend/blue-moon-backend/db.js) |
| JWT middleware | [middleware/auth.js](blue-moon-backend/blue-moon-backend/middleware/auth.js) |
| Auth routes | [routes/auth.js](blue-moon-backend/blue-moon-backend/routes/auth.js) |
| Frontend main | [src/App.jsx](blue-moon-fe/src/App.jsx) |
| API docs | [API_DOCUMENTATION.md](blue-moon-backend/blue-moon-backend/API_DOCUMENTATION.md) |
| Security report | [SECURITY_REPORT.md](blue-moon-backend/blue-moon-backend/SECURITY_REPORT.md) |

## Testing
- Security tests in [test-security.js](blue-moon-backend/blue-moon-backend/test-security.js) - all 10/10 tests passing
- No automated tests for frontend (uses ESLint only)
- Manual API testing via curl or Postman recommended for backend changes
