# 💰 POS System

<p align="center">
  <img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="220" alt="Laravel Logo">
  &nbsp;&nbsp;&nbsp;
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="80" alt="React Logo">
</p>

<h3 align="center">
Modern Point of Sale System
</h3>

<p align="center">
Laravel 12 • React 18 • Docker • REST API
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel" alt="Laravel">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Vite-Latest-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## 📖 Overview

POS System is a modern web-based Point of Sale solution built with Laravel and React.

Designed for:

* 🏪 Retail Stores
* 🍔 Restaurants
* ☕ Cafés
* 🎮 Internet Cafés
* 🛒 Small Businesses

The application provides inventory management, sales processing, customer tracking, reporting, and role-based access control through a responsive and user-friendly interface.

---

## ✨ Features

### 🛒 Sales Management

* Fast POS checkout
* Shopping cart functionality
* Multiple payment methods
* Receipt generation
* Transaction history

### 📦 Inventory Management

* Product management
* Category management
* Stock tracking
* Low-stock monitoring
* Inventory updates in real time

### 👥 Customer Management

* Customer profiles
* Purchase history
* Loyalty point support
* Customer search and lookup

### 📊 Reports & Analytics

* Daily sales reports
* Weekly sales reports
* Monthly sales reports
* Top-selling products
* Revenue analytics

### 🔐 User Roles & Security

* Administrator
* Manager
* Cashier
* Secure authentication
* Protected API routes

### 🌐 Modern Architecture

* RESTful API
* React Single Page Application
* Docker deployment
* Responsive UI
* Scalable backend architecture

---

## 🏗️ Technology Stack

| Layer            | Technology         |
| ---------------- | ------------------ |
| Backend          | Laravel 12         |
| Frontend         | React 18           |
| Build Tool       | Vite               |
| Styling          | Tailwind CSS       |
| API              | REST API           |
| Database         | MySQL / PostgreSQL |
| Containerization | Docker             |
| Reverse Proxy    | Nginx              |
| Authentication   | JWT / Laravel Auth |
| Testing          | PHPUnit            |

---

## 📸 Screenshots

Soon

### Dashboard

```text
docs/screenshots/dashboard.png
```

### POS Screen

```text
docs/screenshots/pos-screen.png
```

### Reports

```text
docs/screenshots/reports.png
```

Example:

```md
![Dashboard](docs/screenshots/dashboard.png)
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/Flow258/pos-system.git
cd pos-system
```

---

## ⚙️ Backend Setup

Install dependencies:

```bash
composer install
```

Copy environment file:

```bash
cp .env.example .env
```

Generate application key:

```bash
php artisan key:generate
```

Configure your database in `.env`.

Run migrations:

```bash
php artisan migrate
```

(Optional) Seed database:

```bash
php artisan db:seed
```

Start Laravel:

```bash
php artisan serve
```

---

## ⚛️ Frontend Setup

Navigate to frontend:

```bash
cd pos-frontend
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build production assets:

```bash
npm run build
```

---

## 🐳 Docker Deployment

Start all containers:

```bash
docker compose up -d
```

Build containers:

```bash
docker compose up -d --build
```

Stop containers:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint         |
| ------ | ---------------- |
| POST   | /api/auth/login  |
| POST   | /api/auth/logout |
| GET    | /api/auth/user   |

### Products

| Method | Endpoint           |
| ------ | ------------------ |
| GET    | /api/products      |
| POST   | /api/products      |
| PUT    | /api/products/{id} |
| DELETE | /api/products/{id} |

### Categories

| Method | Endpoint        |
| ------ | --------------- |
| GET    | /api/categories |
| POST   | /api/categories |

### Transactions

| Method | Endpoint          |
| ------ | ----------------- |
| POST   | /api/transactions |
| GET    | /api/transactions |

### Reports

| Method | Endpoint             |
| ------ | -------------------- |
| GET    | /api/reports/daily   |
| GET    | /api/reports/weekly  |
| GET    | /api/reports/monthly |

---

## 📂 Project Structure

```text
pos-system/
│
├── app/
├── bootstrap/
├── config/
├── database/
├── public/
├── resources/
├── routes/
├── storage/
├── tests/
│
├── pos-frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── docker/
├── docker-compose.yml
├── .env
└── README.md
```

---

## 🔧 Useful Commands

### Laravel

```bash
php artisan migrate
php artisan db:seed
php artisan optimize:clear
php artisan route:list
php artisan queue:work
```

### React

```bash
npm run dev
npm run build
npm run preview
```

### Docker

```bash
docker compose up -d
docker compose down
docker compose logs -f
docker compose restart
```

---

## 🧪 Testing

Run backend tests:

```bash
php artisan test
```

Run PHPUnit:

```bash
vendor/bin/phpunit
```

---

## 🚀 Production Checklist

* Configure HTTPS
* Change default credentials
* Configure backups
* Enable caching
* Configure queue workers
* Set secure environment variables
* Configure monitoring

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to your branch
5. Create a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Flow258**

GitHub:
https://github.com/Flow258

Repository:
https://github.com/Flow258/pos-system

---

## ⭐ Support

If you found this project useful:

* ⭐ Star the repository
* 🍴 Fork the project
* 🐛 Report issues
* 🚀 Contribute improvements

Thank you for supporting the project!
