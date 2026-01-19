
# 📘 docs.md – Technical Documentation

## Project Overview
This backend project implements a secure authentication system using **FastAPI**, **PostgreSQL**, **SQLAlchemy**, and **JWT**.  
It allows users to log in, receive a JWT token, and access protected routes.

---

## Tech Stack
- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- Passlib (bcrypt)
- Python-JOSE (JWT)

---

## Files Description

### 1. `database.py`
Responsible for database connectivity and ORM base setup.
- Creates PostgreSQL engine
- Initializes SQLAlchemy session
- Defines Base class

### 2. `models.py`
Defines database schema using SQLAlchemy.
- `User` table inside `auth` schema
- Fields: id, name, email, password, role

### 3. `main.py`
Main FastAPI application.
- JWT creation and verification
- Login route
- Protected user route
- Dependency injection for DB sessions

---

## JWT Flow
1. User logs in with credentials
2. Server verifies password using bcrypt
3. JWT token generated with email as payload
4. Token returned to client
5. Token used in Authorization header
6. Protected routes decode and validate token

---

## Security
- Password hashing
- Token expiration
- HTTPBearer authentication
- SQLAlchemy ORM protection from SQL Injection

---

## Environment Setup

```bash
pip install fastapi uvicorn sqlalchemy psycopg2 passlib[bcrypt] python-jose
```

Run:
```bash
uvicorn main:app --reload
```

---

## Future Scope
- User registration API
- Refresh tokens
- Role based access control
- Deployment using Docker
