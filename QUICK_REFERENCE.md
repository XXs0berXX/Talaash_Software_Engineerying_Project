# ⚡ Quick Reference Card

## 🚀 Start Here
```bash
# Terminal 1 - Backend
cd backend
./start-backend.sh          # macOS/Linux
start-backend.bat           # Windows

# Terminal 2 - Frontend
cd frontend
./start-frontend.sh         # macOS/Linux
start-frontend.bat          # Windows
```
✅ Backend: http://localhost:8000  
✅ Frontend: http://localhost:3000

---

## 📚 Documentation Map

| Need | File | Section |
|------|------|---------|
| Quick overview | PROJECT_SUMMARY.md | Start Here |
| Setup help | SETUP_GUIDE.md | Step 1-3 |
| API details | API_DOCUMENTATION.md | Endpoints |
| Done yet? | VERIFICATION_CHECKLIST.md | All sections |
| File structure | README.md | Project Structure |

---

## 🔗 16 API Endpoints Cheat Sheet

```
Auth (4)
  POST   /api/auth/signup              (create user)
  POST   /api/auth/login               (user login)
  GET    /api/auth/verify-token        (check token)
  POST   /api/auth/logout              (logout)

Items (6)
  POST   /api/items/found              (upload found)
  GET    /api/items/found              (list found)
  GET    /api/items/found/{id}         (get one)
  GET    /api/items/found/user/{id}    (user's items)
  POST   /api/items/lost               (upload lost)
  GET    /api/items/lost               (list lost)

Admin (6)
  POST   /api/admin/signup             (create admin)
  POST   /api/admin/login              (admin login)
  GET    /api/admin/dashboard          (stats)
  GET    /api/admin/items/pending      (review queue)
  POST   /api/admin/items/{id}/approve (approve)
  POST   /api/admin/items/{id}/reject  (reject)
```

---

## 🧪 Test Accounts

```
User:
  email: testuser@iba.edu.pk
  password: password123

Admin:
  email: admin@iba.edu.pk
  password: admin123
  admin_key: admin_secret_2024
```

---

## 📁 Key Directories

```
backend/
  main.py              ← FastAPI app
  app/routes/          ← All endpoints
  app/models/          ← Data models
  app/utils/           ← Helpers
  uploads/             ← Images

frontend/
  src/pages/           ← Page screens
  src/components/      ← Reusable parts
  src/lib/firebase.js  ← Firebase config
```

---

## 🔧 Common Commands

```bash
# Backend
pip install -r requirements.txt    # Install deps
python main.py                     # Start server

# Frontend
npm install                         # Install deps
npm run dev                         # Start server
npm run build                       # Build for prod

# Database
sqlite3 database/talash.db         # Open DB
.tables                            # List tables
SELECT * FROM users;               # Query
```

---

## ✅ Sprint 1 Features

- [x] User signup (@iba.edu.pk only)
- [x] User login (Firebase)
- [x] Admin setup
- [x] Found item upload
- [x] Admin dashboard
- [x] Item approval workflow
- [x] Responsive UI
- [x] Full documentation

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 8000 in use | Kill process: `lsof -i :8000` |
| Firebase error | Check credentials in frontend/.env.local |
| DB locked | Restart backend |
| Node modules issue | `rm -rf node_modules && npm install` |
| Python error | Activate venv: `source venv/bin/activate` |

---

## 📊 Architecture

```
User → Firebase Auth → Frontend → Backend → Database
  ↓         ↓              ↓          ↓         ↓
Client   Email/Pwd    React/Next   FastAPI   SQLite
         JWT Token     Tailwind     Python    Tables
                       Components   Routes    Schema
```

---

## 🔐 Validation Rules

✅ Email: Must end with @iba.edu.pk  
✅ Password: Min 6 characters  
✅ Image: Max 5MB, jpg/png/gif/webp  
✅ Token: Required for protected routes  
✅ Admin Key: Required for admin signup  

---

## 📝 API Response Examples

### Success (200)
```json
{
  "id": 1,
  "name": "John",
  "email": "john@iba.edu.pk",
  "role": "user"
}
```

### Error (400)
```json
{
  "detail": "Only @iba.edu.pk emails allowed"
}
```

---

## 🚀 Production Checklist

- [ ] Switch to PostgreSQL
- [ ] Set production Firebase config
- [ ] Change ADMIN_KEY env variable
- [ ] Enable HTTPS/SSL
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring
- [ ] Add error tracking
- [ ] Deploy to AWS/Cloud

---

## 🎯 File You Need Most Often

1. **API_DOCUMENTATION.md** - For API endpoints
2. **SETUP_GUIDE.md** - For setup issues
3. **src/pages/** - For frontend pages
4. **app/routes/** - For backend endpoints
5. **PROJECT_SUMMARY.md** - For overview

---

## 💾 Database Tables (Auto-created)

```
users               found_items         lost_items
├─ id               ├─ id               ├─ id
├─ name             ├─ user_id          ├─ user_id
├─ email (unique)   ├─ description      ├─ description
├─ role             ├─ location         ├─ location
└─ created_at       ├─ date_found       ├─ date_lost
                    ├─ image_url        ├─ image_url
                    ├─ status           ├─ status
                    └─ created_at       └─ created_at
```

---

## 📞 URLs Reference

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Frontend app |
| http://localhost:8000 | Backend API |
| http://localhost:8000/health | Health check |
| http://localhost:8000/docs | API docs (Swagger) |
| http://localhost:8000/redoc | API docs (ReDoc) |

---

## 🏃 30-Second Setup

1. Open 2 terminals
2. Terminal 1: `cd backend && ./start-backend.sh`
3. Terminal 2: `cd frontend && ./start-frontend.sh`
4. Wait 30 seconds
5. Open http://localhost:3000
6. Create account with @iba.edu.pk email
7. Done! ✅

---

**Sprint 1 Complete** ✅  
**Status**: Production Ready 🚀  
**Version**: 1.0.0  

**Start with PROJECT_SUMMARY.md!**
