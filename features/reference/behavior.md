# Behavior & Rules Reference

**Living snapshot** of product rules currently in force (Feature 1).

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

## Auth & sessions

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Sign in with **username + password** (username `trim().toLowerCase()`) | `auth.controller` login | Feature 1; ADR-0002 |
| Passwords hashed with bcrypt, `SALT_ROUNDS = 10`; hashes never in API responses | `User.create` + defaultScope | Feature 1 |
| New users get role `worker` | `User` default + register | Feature 1 |
| Session JWT stored in `sessions`; client sends `Authorization: Bearer <token>` | `authenticate` middleware | Feature 1 |
| Session lifetime **24 hours** from creation | JWT `expiresIn: 86400` + `expirationDate` | Feature 1 |
| Login **reuses** a non-expired session for the same user | `issueSessionToken` | Feature 1 |
| Logout clears the session token on the server row | `POST /todo/logout` | Feature 1 |
| Missing/invalid/expired token → `401` `{ message: "Unauthorized! …" }` | `authenticate` | Feature 1 |
| Authenticated requests resolve `req.user.id` from the session | `authenticate` | Feature 1 |

## Client (UX, not enforcement)

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Session stored in `localStorage` key `user` | `Utils.setStore` after login/register | Feature 1 |
| Unauthenticated visit to a protected route → login | `router.beforeEach` | Feature 1 |
| Signed-in visit to login → home | `router.beforeEach` | Feature 1 |
| Axios attaches Bearer token; 401 clears `user` and routes to login | `services.js` | Feature 1 |
| Register email uses shared `emailRules` (required + regex; **"Enter a valid email address."**) | `frontend/src/config/validation.js` | Feature 1 |
| Auth screens and the home placeholder have **no MenuBar** | `App.vue` | Feature 1 |
| Home shows **Welcome, {first name}** and a **Sign out** button | `Home.vue` | Feature 1 |

## Feature provenance

| Area | Introduced |
|------|------------|
| Auth, sessions, protected home placeholder | Feature 1 |
