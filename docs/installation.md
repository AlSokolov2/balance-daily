# Local Installation & Setup

This guide will help you set up the **Balance.Daily** project on your local machine for development and testing.

## Requirements

To run the project, you will need:
1.  **Docker** and **Docker Compose**.
2.  **Node.js** version 20 or higher (for frontend development).
3.  **Git**.

---

## 1. Prepare Files
Clone the repository and enter the project folder:
```bash
git clone <repository-url>
cd balance-daily
```

## 2. Environment Setup
Create a local configuration file:
```bash
cp .env.example .env
```
Edit `.env` if you need to change ports or database credentials. By default, the project uses port `8000` for the web server and `3308` for MySQL.

## 3. Start Containers
Build and start the services:
```bash
docker-compose up -d --build
```
This command will bring up PHP-FPM, Nginx, and MySQL.

## 4. Install Dependencies

### Backend (Inside Docker)
```bash
docker-compose run --rm app composer install
docker-compose run --rm app php artisan key:generate
docker-compose run --rm app php artisan migrate --seed
```

### Frontend (On Host Machine)
```bash
npm install
npm run build
```

## 5. Access the Application
*   **App:** [http://localhost:8000](http://localhost:8000)
*   **Frontend Dev Mode (HMR):** `npm run dev`

---

## Troubleshooting

### MTU Error in WSL2
If you encounter TLS/SSL errors when connecting to Google APIs, ensure that MTU is set to 1400 in `docker-compose.yml` for the network.

### Permissions
If Laravel cannot write to logs or cache, run:
```bash
sudo chmod -R 777 storage bootstrap/cache
```
*(Only for local development!)*
