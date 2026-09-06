# Ceylon Paradise Expeditions

This project is a full-stack tourism website built using:
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: Microsoft SQL Server (MSSQL)

## Project Structure

```bash
ceylon-paradise/
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   └── src/
│       └── config/
│           └── db.js
├── database/
│   └── mssql/
│       ├── 01_create_database.sql
│       ├── 02_create_tables.sql
│       └── 03_seed_data.sql
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── index.css
│       ├── main.jsx
│       └── components/
│           ├── Header.jsx
│           ├── Hero.jsx
│           ├── TourList.jsx
│           └── BookingForm.jsx
└── .gitignore
```

## 1. Database Setup

1. Open SQL Server Management Studio (SSMS) or Azure Data Studio.
2. Run `database/mssql/01_create_database.sql`.
3. Run `database/mssql/02_create_tables.sql`.
4. Run `database/mssql/03_seed_data.sql`.

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Then open:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Default API Endpoints

- GET /api/tours
- POST /api/tours
- GET /api/destinations
- POST /api/destinations
- POST /api/bookings

## Notes

- Configure your database credentials in `backend/.env`.
- For SQL Server Windows Authentication, leave `DB_USER` and `DB_PASSWORD` blank.
- For SQL Server SQL Authentication, fill in `DB_USER` and `DB_PASSWORD` values.
