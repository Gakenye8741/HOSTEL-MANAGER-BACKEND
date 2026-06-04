# Hostel Manager 2026 (Backend)

The robust, production-ready backend engine for managing hostel operations, student billing, room allocations, and administrative oversight.

---

## 🚀 Key Features
* **Secure Auth:** JWT-based authentication with `httpOnly` cookies, preventing XSS-based token theft.
* **Pro-Grade Security:** Multi-layer defense including `helmet` (Security Headers), `hpp` (Parameter Pollution), and strict `cors` policies.
* **Resilient Infrastructure:** Graceful shutdowns for `SIGTERM`/`SIGINT`, automatic memory monitoring, and request correlation IDs for distributed tracing.
* **Validation:** All inputs are strictly validated using `Zod` before reaching the business logic.
* **Observability:** Custom logging middleware and a professional `/health` endpoint for uptime monitoring.

## 🛠 Tech Stack
* **Runtime:** Node.js (v20+), TypeScript
* **Web Framework:** Express.js
* **Database & ORM:** PostgreSQL + Drizzle ORM
* **Security Middleware:** Zod, Argon2, Helmet, Rate-Limiters
* **Utilities:** `uuid`, `dotenv`, `compression`

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone [https://github.com/Gakenye8741/HOSTEL-MANAGER-BACKEND.git](https://github.com/Gakenye8741/HOSTEL-MANAGER-BACKEND.git)
cd HOSTEL-MANAGER-BACKEND

2. Configure Environment Variables
Create a .env file in the root directory by copying the provided example:

Bash
cp .env.example .env

Ensure you set the following variables:

DATABASE_URL: Connection string for your Neon/PostgreSQL database.

JWT_SECRET: A long, random string for signing authentication tokens.

ALLOWED_ORIGINS: Comma-separated list of trusted frontend URLs.

3. Run the Application
Development: pnpm run dev

Build for Production: pnpm run build

Production Start: pnpm run start

🛡 Security & Best Practices
Input Sanitization: Every API endpoint implements strict request body parsing with size limits (10kb) to prevent DoS attacks.

Production Hardening: The API disables x-powered-by headers and implements a strict Content-Security-Policy (CSP) via helmet.

Database Integrity: Using drizzle-orm ensures type-safe SQL queries, inherently preventing traditional SQL injection attacks.

📂 Project Structure
src/
├── Auth/           # Auth routes, controllers, and services
├── middlewares/    # Security, Auth, Rate-limiting & Logging
├── validation/     # Zod validation schemas
├── utils/          # Helper functions (logging, health)
└── server.ts       # Main entry point & shutdown handlers

🌐 Deployment Workflow
This project is configured for cloud deployment:

CI/CD: Pushing to the main branch automatically triggers deployment pipelines.

Health Checks: The /health endpoint is optimized for load balancers to perform continuous uptime verification.

Graceful Shutdown: The server captures shutdown signals to finish pending database transactions before closing.

📜 License
## ⚖️ Legal & Compliance

### Confidentiality Notice
This software, including all source code, documentation, and architecture specifications, is the **sole and exclusive property** of the Hostel Management team. 

* **Authorized Use:** This repository is intended strictly for authorized development and maintenance personnel. 
* **Prohibited Actions:** Any unauthorized reproduction, distribution, reverse engineering, or disclosure of this codebase to third parties is strictly prohibited.
* **Security Protocol:** All developers are expected to adhere to the security guidelines outlined in this document. Do not commit credentials, API keys, or sensitive environment configurations to any public branch.

### Data Protection
This system is designed to handle sensitive student and operational data. All contributors must ensure that data handling complies with applicable privacy regulations. Access logs and audit trails are maintained for all administrative actions to ensure accountability.

### Liability
This software is provided "as is" without warranty of any kind. The authors shall not be held liable for any data breaches, service disruptions, or operational losses resulting from improper configuration, unauthorized modifications, or failure to follow the established security protocols.
