# Behavior & Rules Reference

**Living snapshot** of product rules currently in force (Feature 3).

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

## Lists

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| All list endpoints require `authenticate` | `list.routes` | Feature 2 |
| `userId` on create comes from `req.user.id` only | `list.controller` create | Feature 2 |
| Reads/updates/deletes scope to `{ id, userId: req.user.id }` | `getAccessibleListOrNull` | Feature 2 |
| Cross-user list access returns `404` (never `403`) | `list.controller` | Feature 2 |
| List names trimmed; empty → `400`; over 100 chars → `400` | `validateName` | Feature 2 |
| Lists ordered alphabetically by name | `findAll` `order: name ASC` | Feature 2 |
| Deleting a list deletes its todos | `List hasMany Todo` `onDelete: CASCADE` | Feature 3 |

## Todos

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| All todo endpoints require `authenticate` | `list.routes` / `todo.routes` | Feature 3 |
| Parent list must be owned by `req.user.id` before create or list-scoped read | `getAccessibleListOrNull` | Feature 3 |
| `userId` and `listId` on create come from session + route, not the body | `todo.controller` create | Feature 3 |
| `GET` / `PUT` / `DELETE` on a todo scope to `{ id, userId: req.user.id }` | `getAccessibleTodoOrNull` | Feature 3 |
| Cross-user todo or parent-list access returns `404` (never `403`) | `todo.controller` | Feature 3 |
| Titles trimmed; empty → `400`; over 255 chars → `400` | `validateTitle` | Feature 3 |
| New todos default to `completed: false` | `Todo.create` | Feature 3 |
| Todos ordered incomplete first, then `createdAt` ascending | `findAll` order | Feature 3 |

## Client (UX, not enforcement)

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Session stored in `localStorage` key `user` | `Utils.setStore` after login/register | Feature 1 |
| Unauthenticated visit to a protected route → login | `router.beforeEach` | Feature 1 |
| Signed-in visit to login → home | `router.beforeEach` | Feature 1 |
| Axios attaches Bearer token; 401 clears `user` and routes to login | `services.js` | Feature 1 |
| Register email uses shared `emailRules` (required + regex; **"Enter a valid email address."**) | `frontend/src/config/validation.js` | Feature 1 |
| `MenuBar` shows signed-in name and **Sign out**; hidden on login/register | `MenuBar.vue` / `App.vue` | Feature 2 |
| Dashboard is a single lists view (**My Lists**, `+ New List`, edit/delete dialogs) | `Dashboard.vue` | Feature 2 |
| Empty lists copy: **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 |
| List rows include an **Items** icon that opens a list-items dialog | `Dashboard.vue` | Feature 3 |
| Todo add/edit/delete use nested dialogs; **+ Add Item** is not on the main lists view | `Dashboard.vue` | Feature 3 |
| Empty todos copy: **"No todos in this list yet."** | `Dashboard.vue` | Feature 3 |
| Empty todo title blocked client-side: **"Todo title is required."** | `Dashboard.vue` | Feature 3 |
| Completed todos are struck-through / muted | `Dashboard.vue` `.todo-completed` | Feature 3 |

## Feature provenance

| Area | Introduced |
|------|------------|
| Auth, sessions | Feature 1 |
| Owned lists CRUD and dashboard lists view | Feature 2 |
| Owned todos CRUD and list-items dialogs | Feature 3 |
