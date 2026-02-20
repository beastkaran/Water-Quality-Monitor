# Water Quality Monitor – Milestone 2 Complete Step-by-Step Execution Guide



## 1. Project Overview

The **Water Quality Monitor – Milestone 2** project focuses on building a backend system to monitor and manage water quality data collected from different stations. This milestone emphasizes backend development, database integration, API implementation, and authentication to support future frontend and analytics features.

**Technologies Used:**
- Backend: FastAPI (Python)
- Database: SQLite / PostgreSQL
- ORM: SQLModel / SQLAlchemy
- Authentication: JWT (JSON Web Tokens)
- Server: Uvicorn


## 2. System Requirements (Install First)

### 2.1 Install Python

- Install **Python 3.9 or above**
- Download from: https://www.python.org

Verify installation:
python --version


Expected Output:
Python 3.x.x


---

### 2.2 Install PostgreSQL (Optional)

- Install PostgreSQL (if not using SQLite)
- Set username and password during installation

Verify installation:
psql --version


Expected Output:
psql (PostgreSQL) xx.x


---

### 2.3 Install Git

Verify Git installation:
git --version


Expected Output:
git version 2.x.x


---

## 3. Project Folder Structure

Water-Quality-Monitor/
│
├── backend/
│ ├── main.py
│ ├── database.py
│ ├── models.py
│ ├── auth.py
│ ├── security.py
│ ├── reports.py
│ ├── stations.py
│ └── README.md
│
├── samples/
├── .gitignore
├── requirements.txt
└── README.md


---

## 4. Backend Setup (FastAPI)

### Step 4.1: Clone Repository and Navigate

git clone <repository-url>
cd Water-Quality-Monitor
cd backend


---

### Step 4.2: Create Virtual Environment

python3 -m venv venv


---

### Step 4.3: Activate Virtual Environment

**Windows:**
venv\Scripts\activate


**Mac/Linux:**
source venv/bin/activate


---

### Step 4.4: Install Backend Dependencies

pip install -r requirements.txt


---

### Step 4.5: Setup Environment Variables

Create a `.env` file inside the backend folder.

DATABASE_URL=sqlite:///database.db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30


---

### Step 4.6: Run Backend Server
pip install 'pydantic[email]'
python create_tables.py
python seed_users.py

uvicorn main:app --reload


Expected Output:
INFO: Uvicorn running on http://127.0.0.1:8000


---

### Step 4.7: Verify Backend APIs

Open browser:
http://127.0.0.1:8000/docs


---

## 5. Authentication Flow

1. User logs in
2. Backend generates JWT token
3. Token is used to access protected APIs

Header format:
Authorization: Bearer <token>


---

## 6. Core Functionalities Implemented

- User authentication and authorization
- Water station management APIs
- Water quality reporting APIs
- Database integration using ORM
- Secure password hashing
- Modular backend architecture

---

## 7. Testing the Project

### Using Swagger UI
- Open `/docs`
- Test login API
- Verify protected endpoints

---

## 8. Common Errors & Fixes

- **Module not found** → Run `pip install -r requirements.txt`
- **Port already in use** → Stop previous server
- **Database error** → Check DATABASE_URL in `.env`

---

## 9. Important Notes

- `.env` file should NOT be committed
- `venv/` should be ignored using `.gitignore`
- Backend must be running before testing APIs

---

## 10. Author

**Swathi**