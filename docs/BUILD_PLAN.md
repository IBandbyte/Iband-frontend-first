# iBand Build Plan

This document tracks the build progress for iBand (frontend + backend).

---

## ✅ Completed

- **Backend**
  - Artist model, routes (`/artists`, `/artists/:id/vote`, `/artists/:id/comments`)
  - Admin routes (`/admin/cleanup`, `/admin/report`, `/admin/reset`, `/admin/seed`)
  - CI (GitHub Actions) with lint + smoke test
  - ESLint + Prettier setup
  - Jest smoke test
  - .env support for MONGO_URI and admin key

- **Frontend**
  - Basic `index.html` with admin tools UI
  - `app.js` artist list (fetch + sanitize + dedupe + filter)
  - `VITE_API_URL` in `.env` for configurable backend URL
  - `.gitignore` updated for node_modules, dist, .env

---

## 🚧 In Progress

- Frontend:
  - Hook admin tools (`index.html`) to use `VITE_API_URL`
  - Add styles + responsive UI polish
  - Add dynamic error/debug info for API calls

- Backend:
  - Unit tests for artists, comments, votes
  - Rate limiting & basic security headers
  - Database seed improvements

---

## 📌 Next Steps

- **Dance / Live Streaming Features**  
  - Kinect/Just Dance–style webcam motion integration
  - Real-time dance battles with voting
  - Global party mode: connect multiple live streams
  - Club/venue streaming integration with ads

- **AI Chatbot Expansion**  
  - Interactive band/artist Q&A
  - Merch + ticket sales
  - Personalized recommendations

- **Security & Safety**
  - Panic button & cyber-policing integration
  - Regional content rules & compliance

---

## 🗂 Repo Layout

- `backend/`
  - `server.js`, `artists.js`, `comments.js`, `votes.js`, `admin.js`
  - `.eslintrc.json`, `.prettierrc`, `__tests__/smoke.test.js`
  - `.github/workflows/ci.yml`
  - `.env.example`

- `frontend/`
  - `index.html`, `app.js`, `.env`, `.gitignore`
  - `vite.config.js` (coming soon)

- `BUILD_PLAN.md` (this file)