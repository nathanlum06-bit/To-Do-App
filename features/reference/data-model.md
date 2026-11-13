# Data Model Reference

**Status:** current after Feature 4 (profile).

Sequelize adds `id`, `createdAt`, and `updatedAt` on each table.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required; editable via `PUT /todo/users/:id` |
| `lName` | STRING | Required; editable via `PUT /todo/users/:id` |
| `email` | STRING | Required, unique; editable via `PUT /todo/users/:id` |
| `username` | STRING(100) | Required, unique; stored lowercase; editable via `PUT /todo/users/:id` |
| `password` | STRING(255) | Required; bcrypt hash only; excluded from default scope; optional on profile update |
| `role` | STRING(20) | Default `worker`; read-only in this product |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING(512) | Required; emptied on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required, references `users.id` |

### `lists`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required; trimmed; max 100 characters |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create; never changes |

### `todos`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required; references `lists.id`; cascade on list delete |
| `title` | STRING(255) | Required; trimmed; max 255 characters |
| `completed` | BOOLEAN | Default `false` |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |

## Associations

- `User` hasMany `Session` (`as: "sessions"`, `foreignKey: "userId"`)
- `Session` belongsTo `User` (`as: "user"`, `foreignKey: "userId"`)
- `User` hasMany `List` (`as: "lists"`, `foreignKey: "userId"`)
- `List` belongsTo `User` (`as: "user"`, `foreignKey: "userId"`)
- `List` hasMany `Todo` (`as: "todos"`, `foreignKey: "listId"`, `onDelete: CASCADE`)
- `Todo` belongsTo `List` (`as: "list"`, `foreignKey: "listId"`)
- `User` hasMany `Todo` (`as: "todos"`, `foreignKey: "userId"`)
- `Todo` belongsTo `User` (`as: "user"`, `foreignKey: "userId"`)

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` | Feature 2 |
| `todos` | Feature 3 |
| Profile edits on `users` (no new tables) | Feature 4 |
