# 📚 Talash API Documentation

## Overview

This document provides comprehensive API reference for the Talash Campus Lost and Found Portal backend.

**Base URL**: `http://localhost:8000`  
**API Version**: 1.0.0  
**Authentication**: Firebase JWT Token

---

## 🔐 Authentication

All protected endpoints require a Firebase ID token in the Authorization header:

```http
Authorization: Bearer <firebase_id_token>
```

### Getting a Token

1. User signs up/logs in with Firebase
2. Firebase returns an ID token
3. Include token in all requests to protected endpoints

---

## 📋 Endpoints

### 1️⃣ Authentication Routes

#### 1.1 User Signup

Create a new user account.

```http
POST /api/auth/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@iba.edu.pk"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@iba.edu.pk",
  "role": "user",
  "created_at": "2024-01-15T10:30:00"
}
```

**Errors:**
- `400`: Invalid email domain (not @iba.edu.pk)
- `400`: User already exists
- `422`: Missing required fields

---

#### 1.2 User Login

Authenticate user and return user details.

```http
POST /api/auth/login
Content-Type: application/json
Authorization: Bearer <firebase_token>
```

**Request Body:**
```json
{
  "email": "john@iba.edu.pk",
  "token": "<firebase_id_token>"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@iba.edu.pk",
    "role": "user"
  },
  "token": "<firebase_id_token>"
}
```

**Errors:**
- `400`: Invalid email domain
- `401`: Invalid or expired token
- `404`: User not found

---

#### 1.3 Verify Token

Check if Firebase token is valid.

```http
GET /api/auth/verify-token
Authorization: Bearer <firebase_token>
```

**Response (200 OK):**
```json
{
  "status": "valid",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@iba.edu.pk",
    "role": "user"
  }
}
```

**Alternative Response (if signup needed):**
```json
{
  "status": "needs_signup",
  "email": "john@iba.edu.pk",
  "message": "User needs to complete signup"
}
```

**Errors:**
- `401`: Invalid authorization header format
- `401`: Invalid or expired token

---

#### 1.4 Logout

Logout user (frontend should clear token).

```http
POST /api/auth/logout
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Logged out successfully. Clear your frontend token."
}
```

---

### 2️⃣ Item Routes

#### 2.1 Upload Found Item

Report a found item with image.

```http
POST /api/items/found
Content-Type: multipart/form-data
Authorization: Bearer <firebase_token>
```

**Form Data:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `description` | string | Yes | Item description (max 500 chars) |
| `location` | string | Yes | Location found (max 200 chars) |
| `date_found` | string | Yes | ISO datetime: "2024-01-15T14:30:00" |
| `file` | file | Yes | Image file (max 5MB, jpg/png/gif/webp) |

**Response (201 Created):**
```json
{
  "id": 5,
  "user_id": 1,
  "description": "Blue backpack with laptop",
  "location": "Main Library 2nd Floor",
  "date_found": "2024-01-15T14:30:00",
  "image_url": "/uploads/a1b2c3d4.jpg",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00"
}
```

**Errors:**
- `400`: Missing required fields
- `400`: Invalid date format
- `400`: Invalid file type
- `401`: Invalid or expired token
- `404`: User not found in database
- `413`: File exceeds 5MB limit

---

#### 2.2 Get Found Items List

Retrieve paginated list of found items.

```http
GET /api/items/found?skip=0&limit=10&status_filter=approved
```

**Query Parameters:**
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `skip` | integer | 0 | Number of items to skip (pagination) |
| `limit` | integer | 10 | Number of items to return (1-50) |
| `status_filter` | string | "approved" | Filter: pending, approved, claimed, all |

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": 5,
      "user_id": 1,
      "description": "Blue backpack",
      "location": "Main Library",
      "date_found": "2024-01-15T14:30:00",
      "image_url": "/uploads/a1b2c3d4.jpg",
      "status": "approved",
      "created_at": "2024-01-15T10:30:00"
    }
  ],
  "total": 25
}
```

**Errors:**
- `422`: Invalid query parameters

---

#### 2.3 Get Specific Found Item

Retrieve details of a single found item.

```http
GET /api/items/found/{item_id}
```

**Path Parameters:**
| Parameter | Type | Notes |
|-----------|------|-------|
| `item_id` | integer | ID of the item |

**Response (200 OK):**
```json
{
  "id": 5,
  "user_id": 1,
  "description": "Blue backpack with laptop",
  "location": "Main Library 2nd Floor",
  "date_found": "2024-01-15T14:30:00",
  "image_url": "/uploads/a1b2c3d4.jpg",
  "status": "approved",
  "created_at": "2024-01-15T10:30:00"
}
```

**Errors:**
- `404`: Item not found

---

#### 2.4 Get User's Found Items

Retrieve all found items reported by authenticated user.

```http
GET /api/items/found/user/{user_id}
Authorization: Bearer <firebase_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "items": [
    {
      "id": 5,
      "user_id": 1,
      "description": "Blue backpack",
      "location": "Main Library",
      "date_found": "2024-01-15T14:30:00",
      "image_url": "/uploads/a1b2c3d4.jpg",
      "status": "approved",
      "created_at": "2024-01-15T10:30:00"
    }
  ],
  "total": 3
}
```

---

#### 2.5 Upload Lost Item

Report a lost item with image.

```http
POST /api/items/lost
Content-Type: multipart/form-data
Authorization: Bearer <firebase_token>
```

**Form Data:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `description` | string | Yes | Item description |
| `location` | string | Yes | Location lost |
| `date_lost` | string | Yes | ISO datetime |
| `file` | file | Yes | Image (max 5MB) |

**Response (201 Created):**
```json
{
  "id": 3,
  "user_id": 1,
  "description": "Red wallet with student ID",
  "location": "Cafeteria",
  "date_lost": "2024-01-14T12:00:00",
  "image_url": "/uploads/x1y2z3a4.jpg",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00"
}
```

---

#### 2.6 Get Lost Items List

Retrieve paginated list of lost items.

```http
GET /api/items/lost?skip=0&limit=10&status_filter=approved
```

**Query Parameters:** Same as found items endpoint

**Response (200 OK):**
```json
{
  "items": [...],
  "total": 12
}
```

---

### 3️⃣ Admin Routes

#### 3.1 Admin Signup

Create admin account (requires admin key).

```http
POST /api/admin/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Admin User",
  "email": "admin@iba.edu.pk",
  "admin_key": "admin_secret_2024"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "name": "Admin User",
  "email": "admin@iba.edu.pk",
  "role": "admin",
  "created_at": "2024-01-15T10:30:00"
}
```

**Errors:**
- `401`: Invalid admin key
- `400`: Invalid email domain
- `400`: User already exists

---

#### 3.2 Admin Login

Authenticate admin user.

```http
POST /api/admin/login
Content-Type: application/json
Authorization: Bearer <firebase_token>
```

**Request Body:**
```json
{
  "email": "admin@iba.edu.pk",
  "token": "<firebase_id_token>"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "admin": {
    "id": 2,
    "name": "Admin User",
    "email": "admin@iba.edu.pk",
    "role": "admin"
  },
  "redirect": "/admin/dashboard",
  "token": "<firebase_id_token>"
}
```

**Errors:**
- `401`: Invalid token
- `403`: User is not an admin
- `404`: Admin not found

---

#### 3.3 Admin Dashboard

Get dashboard statistics and data.

```http
GET /api/admin/dashboard
Authorization: Bearer <firebase_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "admin": {
    "id": 2,
    "name": "Admin User",
    "email": "admin@iba.edu.pk"
  },
  "statistics": {
    "pending_items": 5,
    "total_items": 42,
    "approved_items": 37
  }
}
```

---

#### 3.4 Get Pending Items

Retrieve items pending admin review.

```http
GET /api/admin/items/pending?skip=0&limit=20
Authorization: Bearer <firebase_token>
```

**Query Parameters:**
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `skip` | integer | 0 | Pagination |
| `limit` | integer | 10 | Max 50 items |

**Response (200 OK):**
```json
{
  "status": "success",
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "description": "Blue backpack",
      "location": "Main Library",
      "date_found": "2024-01-15T14:30:00",
      "image_url": "/uploads/a1b2c3d4.jpg",
      "status": "pending",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

---

#### 3.5 Approve Item

Approve a found item for public display.

```http
POST /api/admin/items/{item_id}/approve
Authorization: Bearer <firebase_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Item approved successfully",
  "item": {
    "id": 1,
    "user_id": 1,
    "description": "Blue backpack",
    "location": "Main Library",
    "date_found": "2024-01-15T14:30:00",
    "image_url": "/uploads/a1b2c3d4.jpg",
    "status": "approved",
    "created_at": "2024-01-15T10:30:00"
  }
}
```

**Errors:**
- `401`: Invalid token
- `403`: User is not admin
- `404`: Item not found

---

#### 3.6 Reject Item

Reject and delete a found item.

```http
POST /api/admin/items/{item_id}/reject
Authorization: Bearer <firebase_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Item rejected and deleted"
}
```

---

## 🔄 Common Response Formats

### Success Response (2xx)
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response (4xx/5xx)
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## 🔑 Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input/validation failed |
| 401 | Unauthorized | Missing/invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 413 | Payload Too Large | File exceeds size limit |
| 422 | Unprocessable Entity | Invalid data types |
| 500 | Server Error | Unexpected server error |

---

## 📝 Data Formats

### Date/Time Format
All dates use ISO 8601 format:
```
"2024-01-15T14:30:00"
or
"2024-01-15T14:30:00.000Z"
```

### User Roles
- `"user"`: Regular student/staff
- `"admin"`: Lost & Found staff

### Item Status
- `"pending"`: Awaiting admin approval
- `"approved"`: Verified and public
- `"claimed"`: Returned to owner
- `"found"`: (for lost items) Found by someone

---

## 🧪 Testing with cURL

### Test User Signup
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@iba.edu.pk"
  }'
```

### Test Get Found Items
```bash
curl -X GET http://localhost:8000/api/items/found?limit=5
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:8000/api/admin/dashboard \
  -H "Authorization: Bearer <your_firebase_token>"
```

---

## 📊 Rate Limiting

Currently no rate limiting. Production deployment should implement:
- 100 requests/minute per user
- 1000 requests/minute per IP

---

## 🔒 Security Notes

- All passwords handled by Firebase (never stored in backend)
- Tokens expire after 1 hour (Firebase default)
- CORS enabled for localhost only
- File upload restrictions: 5MB max, image types only
- Database queries use parameterized statements (SQL injection safe)

---

## 🚀 Pagination Example

For large result sets, use pagination:

```http
GET /api/items/found?skip=0&limit=10
```

First page: `skip=0`  
Second page: `skip=10`  
Third page: `skip=20`

---

## 📞 API Documentation UI

Interactive API docs available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

**Last Updated**: November 2024  
**Version**: 1.0.0
