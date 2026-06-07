# Contributing Guide

Thank you for your interest in contributing to **Balance.Daily**! To make the development process efficient and consistent, we follow these standards.

[🇷🇺 Читать на русском](CONTRIBUTING.ru.md)

## 📣 Feedback & Bug Reports

If you've found a bug or have an idea to improve the app, please let us know! We use **GitHub Issues** with simple forms to make it easy for everyone:

*   **🐞 Report a Bug:** Use our [Bug Report form](https://github.com/AlSokolov2/balance-daily/issues/new?template=bug-report.yml) to tell us what went wrong.
*   **💡 Suggest an Idea:** Use our [Feature Request form](https://github.com/AlSokolov2/balance-daily/issues/new?template=feature-request.yml) to share your thoughts.
*   **💬 General Chat:** For questions or just to say hi, visit our [Discussions](https://github.com/AlSokolov2/balance-daily/discussions).

## 🛠 Environment

The project is configured to run via Docker. Main services:
*   **app**: Laravel (PHP 8.4-FPM).
*   **nginx**: Web server.
*   **db**: MySQL 8.0.

## 📜 Code Standards

### Backend (PHP)
*   Adhere to **PSR-12** standards.
*   Use **PHPDoc** for documenting controller methods and models.
*   Follow Laravel naming conventions for new files and classes.

### Frontend (Vue/JS)
*   Use **Vue 3 Composition API** (`<script setup>`).
*   Style components using **Tailwind CSS**.
*   Document complex logic (e.g., in Pinia Store) using **JSDoc**.

## 💬 Commit Messages

We use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. Examples:
*   `feat:` — new functionality.
*   `fix:` — bug fix.
*   `docs:` — documentation changes.
*   `test:` — adding or correcting tests.
*   `refactor:` — code changes that neither fix a bug nor add a feature.

## 🧪 Testing

No new feature will be accepted without test coverage.

### Run Backend Tests (PHPUnit):
```bash
docker-compose run --rm app php artisan test
```

### Run Frontend Tests (Vitest):
```bash
npm test
```

## 🚀 Development Workflow

1.  Create a branch for your task (`git checkout -b feature/my-new-feature`).
2.  Write code and tests.
3.  Ensure all tests pass.
4.  Commit your changes with a clear message.
5.  Open a Pull Request.

---
*Let's make task management better together!* 🚀
