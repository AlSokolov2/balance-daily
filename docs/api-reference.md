# API Reference

All endpoints require authentication via the `Authorization: Bearer <token>` header.

## Authentication

*   `GET /auth/google` — Redirect to the Google login page.
*   `GET /auth/google/callback` — Handle the Google callback and issue a token.
*   `GET /api/user` — Get the current user's profile.
*   `POST /api/logout` — Revoke the current token.

## Categories (`/api/categories`)

*   `GET /` — List user categories.
*   `POST /` — Create or update a category by its `slug`.
*   `PUT /{id}` — Update category parameters.
*   `DELETE /{id}` — Delete a category.

## Tasks (`/api/tasks`)

*   `GET /` — List user tasks.
*   `POST /` — Create a new task.
*   `PUT /{id}` — Edit an existing task.
*   `DELETE /{id}` — Delete a task.

## Settings & Data

*   `GET /api/settings` — Get a dictionary of settings (e.g., `notepad_text`).
*   `POST /api/settings` — Batch update settings.
*   `GET /api/export` — Export all user data in JSON format.
*   `POST /api/import` — Full replacement of user data with JSON data.

---

## Data Formats

### Task Object
```json
{
  "title": "Go to the gym",
  "category_slug": "life",
  "importance": 2.0,
  "repeat_type": "weekly",
  "repeat_days": [1, 3, 5],
  "notes": "Monday, Wednesday, Friday"
}
```
