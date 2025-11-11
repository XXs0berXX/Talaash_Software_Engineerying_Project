# 🚀 Talash - Complete Setup Guide

## Step 1: Firebase Setup (5 minutes)

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Name: `Talash Campus Portal`
4. Continue with default settings
5. Wait for project creation

### 1.2 Enable Authentication
1. In left sidebar, go to **Authentication**
2. Click **Get Started**
3. Click **Email/Password**
4. Toggle "Enable"
5. Save

### 1.3 Get Firebase Credentials
1. Go to **Project Settings** (gear icon)
2. Switch to **General** tab
3. Scroll down to "Your apps"
4. If no app exists, click "Add app" and select web icon
5. Copy the configuration object:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "project-id.firebaseapp.com",
  projectId: "project-id",
  storageBucket: "project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd1234"
};
```

---

## Step 2: Backend Setup (10 minutes)

### 2.1 Python Setup
```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2.2 Install Dependencies
```bash
pip install -r requirements.txt
```

### 2.3 Configure Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env (optional, defaults work for dev)
# Windows: notepad .env
# macOS/Linux: nano .env
```

### 2.4 Start Backend
```bash
python main.py
```

✅ You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

Test: Open http://localhost:8000/health in browser

---

## Step 3: Frontend Setup (10 minutes)

### 3.1 Node Setup
```bash
cd frontend
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Configure Firebase

**Copy `.env.example` to `.env.local`:**
```bash
cp .env.example .env.local
```

**Edit `.env.local` and add Firebase credentials:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3.4 Start Frontend
```bash
npm run dev
```

✅ You should see:
```
> ready - started server on 0.0.0.0:3000
```

Open http://localhost:3000 in browser

---

## 🧪 Testing the Application

### Test User Registration
1. Go to http://localhost:3000/signup
2. Enter:
   - Name: `Test User`
   - Email: `test@iba.edu.pk`
   - Password: `password123`
3. Click "Sign Up"
4. Should redirect to login

### Test User Login
1. Go to http://localhost:3000/login
2. Enter credentials
3. Should redirect to home page
4. User info shown in navbar

### Test Admin Registration
1. Go to http://localhost:3000/admin/login
2. Click signup link (if available)
3. Enter:
   - Name: `Admin User`
   - Email: `admin@iba.edu.pk`
   - Admin Key: `admin_secret_2024`
4. Click "Sign Up"

### Test Upload Found Item
1. Login as regular user
2. Click "Report Found" in navbar
3. Fill form:
   - Description: `Blue Backpack`
   - Location: `Main Library`
   - Date: `2024-01-15`
   - Image: Upload a photo
4. Click "Report Item"
5. Should show success message

### Test Admin Dashboard
1. Login as admin
2. Should redirect to `/admin/dashboard`
3. See pending items
4. Click "Approve" or "Reject"

---

## 📊 Database Check

### View SQLite Database
```bash
# Windows
python -m sqlite3 database\talash.db

# macOS/Linux
sqlite3 database/talash.db
```

### Common SQLite Commands
```sql
-- List all tables
.tables

-- View users
SELECT * FROM users;

-- View found items
SELECT * FROM found_items;

-- Count items
SELECT COUNT(*) FROM found_items;

-- Exit
.quit
```

---

## 🐛 Debugging Tips

### Enable Debug Mode
Edit `backend/main.py`:
```python
uvicorn.run(
    "main:app",
    host="0.0.0.0",
    port=8000,
    reload=True,  # Auto-reload on changes
    log_level="debug"  # More verbose logging
)
```

### Check API Documentation
Visit http://localhost:8000/docs in browser - this shows interactive API docs

### View Backend Logs
Errors appear in the terminal where you ran `python main.py`

### Check Firebase Connection
Frontend console errors appear in browser DevTools (F12 > Console tab)

---

## ⚡ Common Issues

| Issue | Fix |
|-------|-----|
| Port 8000 in use | Change port in `main.py` |
| Firebase not loading | Check credentials in `.env.local` |
| Image upload fails | Ensure `uploads/` folder exists |
| Database locked | Close other SQLite connections |
| CORS errors | Backend already has CORS enabled |

---

## 📦 Project Dependencies

### Backend (`requirements.txt`)
- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **sqlalchemy**: Database ORM
- **pydantic**: Data validation
- **firebase-admin**: Firebase SDK
- **python-multipart**: File upload
- **python-jose**: JWT tokens

### Frontend (`package.json`)
- **next**: React framework
- **react**: UI library
- **firebase**: Auth & storage
- **axios**: HTTP client
- **tailwindcss**: CSS framework

---

## 🔄 Git Workflow

### Initial Commit
```bash
git add .
git commit -m "feat: initial project setup"
git push
```

### Feature Branch
```bash
git checkout -b feat/feature-name
# Make changes
git commit -m "feat: add feature"
git push origin feat/feature-name
# Create Pull Request on GitHub
```

---

## ✅ Verification Checklist

- [ ] Backend runs on port 8000
- [ ] Frontend runs on port 3000
- [ ] Firebase credentials configured
- [ ] Can create user account
- [ ] Can login with credentials
- [ ] Can upload found item
- [ ] Can view items on home page
- [ ] Admin can approve items
- [ ] Database file created at `database/talash.db`

---

## 🎯 Next Steps

1. **Test all endpoints** using Postman or curl
2. **Review code** in all route files
3. **Customize branding** (colors, logo)
4. **Set up deployment** for staging
5. **Configure email notifications** (optional)
6. **Add unit tests** for critical functions

---

## 📞 Support

For issues:
1. Check console for error messages
2. Review relevant code file
3. Check API docs at http://localhost:8000/docs
4. Ask team members on Discord/Slack

---

**Last Updated**: November 2024  
**Version**: 1.0.0 (Sprint 1)
