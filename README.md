# Student Information System

A production-ready NestJS application for Student Information System (SIS), built with a focus on scalability, security, and maintainability.

## 🚀 Features

- **Framework**: NestJS 11
- **Database**: PostgreSQL with Prisma ORM 7
- **Multi-tenancy**: Organization-based data isolation
- **Authentication**: JWT-based Auth (Support for Multi-tenant Login)
- **Validation**: Global ValidationPipe with Joi for Environment variables
- **Documentation**: Swagger OpenAPI interactive documentation
- **Security**: Helmet, CORS, and standard security practices
- **Logging**: High-performance JSON logging with `nestjs-pino`
- **Infrastructure**: Docker and Docker Compose support

## 🛠 Prerequisites

Ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v22.12.0 or higher)
- [pnpm](https://pnpm.io/) (Package Manager)
- [Docker](https://www.docker.com/) & Docker Compose (for local database)

### ⚡️ Quick Start (Docker - Recommended)

Run the entire application (Database + API) with a single command. The setup is fully automated.

1.  **Clone the repository**

    ```bash
    git clone <repository_url>
    cd sis-backend
    ```

2.  **Start the Application**

    ```bash
    docker compose up --build
    ```

    - This will start PostgreSQL and the NestJS API.
    * Database migrations will run automatically.
    * **Seeding runs automatically**: The demo tenant (Al-Mkki) will be created.
    * The API will start on `http://localhost:3001`.

---

### 🛠️ Manual / Local Development Setup

If you prefer to run the application code locally (e.g., for debugging):

1.  **Install Dependencies**

    ```bash
    pnpm install
    ```

2.  **Configure Environment**

    ```bash
    cp .env.example .env
    ```

3.  **Start Database Only**

    ```bash
    docker compose up -d db
    ```

4.  **Run Migrations**

    ```bash
    npx prisma migrate dev
    ```

5.  **Seed Database (Required for First Run)**
    Initialize the database with default languages and the demo tenant:

    ```bash
    npx ts-node src/scripts/seed-tenant.ts
    ```

    - Creates default languages (`en`, `ar`).
    - Creates a demo tenant: **Al-Mkki Ed-Tech** (Slug: `al-mkki`).

6.  **Start Application**
    ```bash
    # Development mode
    pnpm start:dev
    ```

## 📚 Documentation

Interactive API documentation via Swagger is available at:

[http://localhost:3001/api/docs](http://localhost:3001/api/docs)

> **Note:** The API is versioned. The base URL for endpoints is `http://localhost:3001/api/v1`.

## 📂 Project Structure

```
src/
├── common/          # Global pipes, guards, filters, interceptors
├── config/          # Type-safe configuration modules
├── infrastructure/  # Database (Prisma) and external services
├── modules/         # Feature modules (Auth, etc.)
└── main.ts          # Application entry point
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```
