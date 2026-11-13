# API Reference

**Status:** current after Feature 1 (auth).

Base path: `/todo`. Authenticated routes send `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Starter health check |
| `POST` | `/todo/register` | No | Create account and session |
| `POST` | `/todo/login` | No | Authenticate; reuse a non-expired session when one exists |
| `POST` | `/todo/logout` | Yes | Invalidate the current session token |
| `GET` | `/todo/lists` | Yes | Protected stub (empty array). Feature 2 replaces this with owned-list CRUD |

## Auth success payload (`POST /todo/register` `201`, `POST /todo/login` `200`)

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

Password hashes are never returned.

## Errors

`{ "message": "Human-readable explanation." }` with the matching HTTP status.

| Situation | Status | Message |
|-----------|--------|---------|
| Duplicate username | `400` | `Username is already taken.` |
| Duplicate email | `400` | `Email is already registered.` |
| Missing email (register) | `400` | `Email is required.` |
| Password shorter than 8 (register) | `400` | `Password must be at least 8 characters.` |
| Missing username (login/register) | `400` | `Username is required.` |
| Missing password (login/register) | `400` | `Password is required.` |
| Bad credentials | `401` | `Invalid username or password.` |
| Missing / invalid / expired token | `401` | `Unauthorized! …` |

## Feature provenance

| Area | Introduced |
|------|------------|
| Auth register / login / logout | Feature 1 |
| Protected `GET /todo/lists` stub | Feature 1 (replaced by Feature 2) |
