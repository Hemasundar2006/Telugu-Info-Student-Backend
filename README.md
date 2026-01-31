# Telugu Info Student – Backend

RESTful API backend for the Telugu Info Student app (Node.js v18+, Express, MongoDB, JWT, Multer, Nodemailer, Socket.io, node-cron).

## Tech Stack

- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT + bcrypt
- **Files:** Local storage with Multer
- **Validation:** express-validator
- **Email:** Nodemailer
- **PDF:** pdf-parse
- **Jobs:** node-cron
- **Realtime:** Socket.io
- **Security:** Helmet, CORS, rate limiting

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with MONGO_URI, JWT_SECRET, EMAIL_*, CLIENT_URL
```

## Run

```bash
# Development
npm run dev
# or
node server.js
```

Default port: **5000**. Health: `GET /health`.

## Environment (.env)

| Variable        | Description                    |
|----------------|--------------------------------|
| NODE_ENV       | development / production       |
| PORT           | Server port (default 5000)    |
| MONGO_URI      | MongoDB connection string      |
| JWT_SECRET     | Secret for JWT signing         |
| JWT_EXPIRE     | Token expiry (e.g. 30d)        |
| EMAIL_HOST     | SMTP host                      |
| EMAIL_PORT     | SMTP port                      |
| EMAIL_USER     | SMTP user                      |
| EMAIL_PASSWORD | SMTP password                  |
| CLIENT_URL     | Frontend origin for CORS       |
| MAX_FILE_SIZE  | Max upload size in bytes       |

## Project Structure

```
├── src/
│   ├── config/       # DB config
│   ├── models/       # Mongoose schemas (User, Resource, Job, Course, etc.)
│   ├── controllers/  # Request handlers
│   ├── routes/       # API routes
│   ├── middleware/   # Auth, validation, upload, errors, rate limit
│   ├── services/     # Email, notifications, recommendations, gamification
│   ├── validators/   # express-validator rules
│   ├── utils/        # Helpers
│   ├── jobs/         # Cron (cleanup, reminders)
│   └── socket/       # Socket.io server
├── uploads/          # resources, profiles, forum, jobs
├── server.js
└── package.json
```

## API Overview

- **Auth:** `/api/auth` – register, login, forgot/reset password, verify email, refresh, logout
- **Users:** `/api/users` – profile, preferences, stats, badges (protected)
- **Resources:** `/api/resources` – CRUD, search, branch/subject/semester, download, rate, comment, bookmark
- **Jobs:** `/api/jobs` – list, search, recommended, government/private/internships, apply, bookmark, reminders
- **Courses:** `/api/courses` – list, search, recommended, bookmark, enroll, progress
- **Interviews:** `/api/interviews/experiences` and `/api/interviews/questions` – CRUD, upvote, comment, bookmark
- **Links:** `/api/links` – important links, categories, bookmark, verify
- **Forum:** `/api/forum/posts` and `/api/forum/answers` – posts, answers, upvote, accept, report
- **Notifications:** `/api/notifications` – list, unread, mark read, clear
- **Money tips:** `/api/money-tips` – list, category, bookmark, upvote
- **Tech news:** `/api/tech-news` – list, category, view, bookmark
- **Colleges:** `/api/colleges` – list, search, by state
- **Analytics:** `/api/analytics` – dashboard, popular resources, trending jobs, user activity
- **Admin:** `/api/admin` – users, verify, pending resources, approve/reject, reports, stats (admin only)

## Security

- JWT in `Authorization: Bearer <token>`
- Passwords hashed with bcrypt (10 rounds)
- Helmet and CORS enabled
- Rate limiting (e.g. 100 req/15 min per IP)
- Input validation via express-validator
- File type/size limits in Multer

## License

ISC
