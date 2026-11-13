# API Reference

**Status:** current after Feature 3 (todos).

Base path: `/todo`. Authenticated routes send `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Starter health check |
| `POST` | `/todo/register` | No | Create account and session |
| `POST` | `/todo/login` | No | Authenticate; reuse a non-expired session when one exists |
| `POST` | `/todo/logout` | Yes | Invalidate the current session token |
| `GET` | `/todo/lists` | Yes | Owned lists, ordered by name |
| `POST` | `/todo/lists` | Yes | Create a list owned by `req.user.id` |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list (todos cascade) |
| `GET` | `/todo/lists/:listId/todos` | Yes | Todos in an owned list; incomplete first, then `createdAt` ascending |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update an owned todo (title and/or `completed`) |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |

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

## List success payload (`POST /todo/lists` `201`, `PUT /todo/lists/:listId` `200`)

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /todo/lists` returns an array of that shape. `DELETE` returns `200` with `{ "message": "List with id=<id> deleted." }`.

## Todo success payload (`POST /todo/lists/:listId/todos` `201`, `PUT /todo/todos/:id` `200`)

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

`GET /todo/lists/:listId/todos` returns an array of that shape. `DELETE /todo/todos/:id` returns `200` with `{ "message": "Todo with id=<id> deleted." }`.

Create body: `{ "title": "Buy milk" }`. `userId` and `listId` are set from the session and route; client-supplied ownership fields are ignored. New todos default to `completed: false`.

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
| Empty list name | `400` | `List name is required.` |
| List name longer than 100 | `400` | `List name must be 100 characters or fewer.` |
| Invalid list id | `400` | `Invalid list id.` |
| List not found or not owned | `404` | `List with id=<id> not found.` |
| Empty todo title | `400` | `Todo title is required.` |
| Todo title longer than 255 | `400` | `Todo title must be 255 characters or fewer.` |
| Invalid todo id | `400` | `Invalid todo id.` |
| Todo not found or not owned | `404` | `Todo with id=<id> not found.` |

## Feature provenance

| Area | Introduced |
|------|------------|
| Auth register / login / logout | Feature 1 |
| List CRUD | Feature 2 |
| Todo CRUD (list-scoped) | Feature 3 |
