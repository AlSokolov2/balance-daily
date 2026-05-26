# ⚖️ Balance.Daily

[![Laravel](https://img.shields.io/badge/backend-Laravel%2013-ff2d20.svg)](https://laravel.com)
[![Vue](https://img.shields.io/badge/frontend-Vue%203-42b883.svg)](https://vuejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[🇷🇺 Читать на русском](README.ru.md)

**Balance.Daily** is an advanced personal task and life balance manager built on a modern technology stack. It combines classic task tracking with a powerful dynamic prioritization engine and unique "bubble chart" visualization.

## 🚀 Key Features

*   **Smart Prioritization:** Automatically calculates task weight based on category, importance, deadlines, and overdue days.
*   **Dynamic Balance:** The system automatically increases the priority of life spheres that haven't received enough attention recently.
*   **Interactive Visualization:** A custom-built bubble chart to visually highlight your most important daily tasks.
*   **Recurring Tasks:** Flexible cycle settings (intervals or specific weekdays) with automatic "hide-until-next" logic.
*   **Google Auth:** Secure authentication and cloud synchronization for your personal data.
*   **Full Data Isolation:** Strict privacy enforcement — every user operates within their own secured sandbox.

## 🛠 Technology Stack

*   **Backend:** PHP 8.4+, Laravel 13, Sanctum (API Auth), Socialite (OAuth).
*   **Frontend:** Vue 3 (Composition API), Pinia (State Management), Tailwind CSS 4.
*   **DevOps:** Docker, GitHub Actions (CI/CD), SSH Deployment.

## 🏁 Quick Start

### Local Development (Docker)

1. Clone the repository.
2. Create your environment file: `cp .env.example .env`.
3. Start the services:
   ```bash
   docker-compose up -d
   ```
4. Install dependencies and build assets:
   ```bash
   npm install && npm run build
   ```
5. Access the app at: [http://localhost:8000](http://localhost:8000)

## 📚 Documentation

Detailed technical guides:

*   📖 [**Installation & Setup**](./docs/installation.md) — Local deployment guide.
*   🚀 [**Deployment Guide**](./docs/deployment.md) — SSH, Shared hosting, CI/CD.
*   🧬 [**Prioritization Algorithm**](./docs/prioritization-algorithm.md) — How the math behind the app works.
*   📡 [**API Reference**](./docs/api-reference.md) — API documentation for developers.

## 🤝 Contributing

We welcome contributions! Please check out the [CONTRIBUTING.md](./CONTRIBUTING.md) guide before you start.

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

---
*Created with love for productivity. 🧘*
