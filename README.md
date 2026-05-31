# ⚖️ Balance.Daily

[![Laravel](https://img.shields.io/badge/backend-Laravel%2013-ff2d20.svg)](https://laravel.com)
[![Vue](https://img.shields.io/badge/frontend-Vue%203-42b883.svg)](https://vuejs.org)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[🇷🇺 Читать на русском](README.ru.md)

**Balance.Daily** is an advanced personal task and life balance manager built on a modern technology stack. It combines classic task tracking with a powerful dynamic prioritization engine and unique "bubble chart" visualization.

## 🚀 Key Features

*   **Smart Sync:** Incremental data synchronization (deltas) for 90% faster networking.
*   **Push Notifications:** Native browser reminders for task deadlines (Web Push API).
*   **Global Search:** Instant task lookup with unique visual bubble focusing.
*   **Smart Prioritization:** Automatically calculates task weight based on category, importance, deadlines, and overdue days.
*   **Dynamic Balance:** The system automatically increases the priority of life spheres that haven't received enough attention.
*   **Interactive Visualization:** A custom-built bubble chart powered by **Web Workers** for 60fps performance even with many tasks.
*   **Dark Mode:** Full support for dark themes with automatic system preference detection.
*   **PWA (Progressive Web App):** Installable on mobile and desktop. Loads instantly with offline support and instant update notifications.
*   **Real-time Sync:** Automatic priority updates every minute and automatic "New Day" reset at midnight.
*   **Data Security (SSE):** Server-Side Encryption (AES-256) for all personal user data in the database.
*   **Handheld-First Design:** Optimized for one-handed use with advanced gestures (pinch-to-zoom, horizontal swipes).

## 🛠 Technology Stack

*   **Backend:** PHP 8.4+, Laravel 13, Sanctum (API Auth), Socialite (OAuth).
*   **Frontend:** Vue 3 (Composition API), Pinia (State Management), Vite 8, Tailwind CSS 4.
*   **Infrastructure:** Service Workers (PWA), Web Workers (Offloaded calculations).
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
