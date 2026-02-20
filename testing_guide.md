
# 🧪 API Testing Guide (FastAPI + Swagger + Postman)

You can test APIs using:
1. FastAPI Swagger UI
2. Postman

---

## 1. Using Swagger UI

Start server:
```bash
uvicorn main:app --reload
```

Open:
```
http://127.0.0.1:8000/docs
```

### Test Login
1. Click POST `/login`
2. Click "Try it out"
3. Enter:
```json
{
  "email": "test@gmail.com",
  "password": "123456"
}
```
4. Execute → Copy accessToken

### Test Protected Route
1. Click GET `/user`
2. Click Authorize
3. Enter:
```
Bearer <your_token>
```
4. Execute → You will get user data

---

## 2. Using Postman

### Login Request
Method: POST  
URL:
```
http://127.0.0.1:8000/login
```
Body → Raw → JSON:
```json
{
  "email": "test@gmail.com",
  "password": "123456"
}
```

### Protected User Request
Method: GET  
URL:
```
http://127.0.0.1:8000/user
```
Headers:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Expected Output

```json
{
  "id": 1,
  "name": "Karan",
  "email": "karan@gmail.com",
  "role": "admin"
}
```

---

## Testing Checklist
- [ ] Login returns token
- [ ] Invalid login fails
- [ ] Token required for /user
- [ ] Expired token rejected
- [ ] Correct user data returned

---

## Tips
- Always restart server after code changes
- Keep token secret
- Use environment variables in production
