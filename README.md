<p align="center">
  <img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="200" alt="Laravel Logo">
  &nbsp;&nbsp;&nbsp;
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="70" alt="React Logo">
</p>

<p align="center">
  <strong>Modern Point of Sale System</strong><br>
  Laravel 12 Backend + React 18 Frontend – Dockerised for OpenMediaVault
</p>

<p align="center">
  <a href="https://github.com/Flow258/pos-system/actions"><img src="https://github.com/Flow258/pos-system/workflows/tests/badge.svg" alt="Build Status"></a>
  <a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
  <a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

---

## 📌 Overview

This is a **complete Point‑of‑Sale (POS) system** designed for retail stores, restaurants, or cyber‑cafes that also sell goods. It features:

- **Product & category management** (CRUD, stock tracking)
- **Shopping cart** with real‑time updates
- **Customer profiles & loyalty points**
- **Multiple payment methods** (cash, card, digital wallets)
- **Sales reports** (daily/weekly, top products, stock alerts)
- **Receipt printing** (browser‑based)
- **Multi‑user roles** (admin, cashier, manager)
- **Fully Dockerised** – easy deployment on any Linux server (OpenMediaVault, Ubuntu, etc.)

The backend is built with **Laravel 12** (REST API), and the frontend is a **React 18** single‑page application served via Nginx. The whole stack runs inside Docker containers.

---

## 🚀 Quick Start (Docker)

### 1. Clone the repository
```bash
git clone https://github.com/Flow258/pos-system.git
cd pos-system

2. Build the React frontend
bash
cd pos-frontend
npm install
npm run build   # produces dist/ folder
cd ..
3. Configure environment
Copy the example environment file and edit the database password and JWT secret:

bash
cp .env.omv .env
nano .env   # set DB_PASSWORD, JWT_SECRET, APP_URL (your server IP)
4. Start all containers
bash
docker compose up -d
Your POS will be available at http://your-server-ip (default port 80).

Default cashier login:

Username: admin

Password: password (change immediately!)

📦 Tech Stack
Component	Technology
Backend API	Laravel 12 (PHP 8.2)
Frontend	React 18 + Vite + Tailwind CSS
Database	PostgreSQL 15 (or MySQL 8)
Web Server	Nginx (reverse proxy)
Container	Docker + Docker Compose
Testing	PHPUnit, Laravel Pint
🔌 API Endpoints (Examples)
All API routes are prefixed with /api and require a valid JWT token.

Method	Endpoint	Description
POST	/api/auth/login	Cashier login
GET	/api/products	List all products
POST	/api/cart/add	Add item to cart
POST	/api/transactions	Complete a sale
GET	/api/reports/daily	Today’s sales summary
GET	/api/reports/stock-alerts	Products with low stock
Full API documentation is available at /api/docs (Swagger UI) after installation.

🐳 Docker Services
The docker-compose.yml runs four containers:

Service	Purpose
laravel	PHP‑FPM + Laravel application
react	Serves the React frontend (static)
nginx	Reverse proxy (routes /api to Laravel, / to React)
db	PostgreSQL database
Optional: redis for caching and queues (uncomment in compose file).

🔧 Maintenance Commands
bash
# View logs
docker compose logs -f laravel

# Run database migrations
docker compose exec laravel php artisan migrate

# Clear Laravel cache
docker compose exec laravel php artisan optimize:clear

# Backup database
docker compose exec db pg_dump -U pos_user pos_db > backup.sql

# Rebuild and restart after code changes
docker compose up -d --build
📄 License
This project is open‑source software licensed under the MIT license.

👤 Author
Flow258 – GitHub

Project Repository: https://github.com/Flow258/pos-system

⭐ Support
If this POS system helps your business, please consider giving it a star on GitHub!
