# React Auth Sample

This is a minimal React component (`AuthForm.jsx`) demonstrating how to register, login and verify token against the Blue Moon backend.

Usage:
1. Copy `AuthForm.jsx` into your React project (e.g. `src/components/AuthForm.jsx`).
2. If your backend is not `http://localhost:3000`, set `REACT_APP_API_BASE` in your `.env`.
3. Import and render the component:

```jsx
import AuthForm from './components/AuthForm';

function App(){
  return <AuthForm />;
}
```

Notes:
- On successful login the token is stored in `localStorage` under `bm_token`.
- Use the token for protected endpoints with `Authorization: Bearer <token>` header.
