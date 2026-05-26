# Contributing to Balance.Daily Online

Thank you for your interest in contributing to **Balance.Daily Online**! We appreciate any help that makes this productivity tool better.

## How Can I Contribute?

### Reporting Bugs
- Before creating a bug report, please check that it hasn't been reported already.
- When creating a report, include steps to reproduce the bug and details about your browser and OS.

### Suggesting Enhancements
- Check that the feature hasn't been requested already.
- Explain the benefit of the feature and how it should work.

### Pull Requests
1.  Fork the repo and create your branch from `main`.
2.  Install dependencies: `npm install` (in both `client/` and `server/` folders).
3.  Ensure your code follows the project's style (run `npm run lint`).
4.  Make sure all tests pass: `npm test`.
5.  Include new tests if you're adding new logic.
6.  Submit the PR!

## Development Standards

-   **TypeScript:** All new code must be strictly typed. Avoid `any`.
-   **Architecture:** Follow the established pattern (Zustand for state, Express controllers for API).
-   **I18n:** Every text in the UI should be added to `client/src/i18n.ts`.

## Code of Conduct
Please be respectful and helpful to others in the community.

---
*Happy coding!* 🚀
