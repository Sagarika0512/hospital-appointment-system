# Hospital Management System

A full-stack, enterprise-grade healthcare management application designed for clinic operations, patient account management, doctor directories, and concurrency-safe appointment scheduling with role-based access control (RBAC).

---

## 1. Project Overview

The **Hospital Management System** provides a secure platform for hospital administrative staff and patients:
- **Authentication & User Management**: Secure registration and login using BCrypt password hashing and stateless JWT tokens.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `ROLE_ADMIN` (doctor and patient management, appointment completion/cancellation) and `ROLE_PATIENT` (profile access, appointment booking, self-cancellation).
- **Doctor Directory**: Paginated listings of medical specialists with department categorization.
- **Patient Directory**: Secure patient registry linked directly to user accounts, preventing profile leaks.
- **Concurrency-Safe Appointment Scheduling**: Prevents overlapping doctor/date/time slots under concurrent booking load via database constraints and transaction isolation.
- **Interactive UI**: Responsive React interface with live toast notifications, authentication state persistence, and protected routes.

---

## 2. Technology Stack

- **Backend**: Java 17, Spring Boot 4.0.3 (Spring Framework 7)
  - **Security**: Spring Security 7, Stateless JWT (`io.jsonwebtoken:jjwt` 0.12.6), BCrypt
  - **Persistence**: Spring Data JPA, Hibernate ORM 7.2.4
  - **API Documentation**: Springdoc OpenAPI / Swagger UI 2.8.5
  - **Monitoring**: Spring Boot Actuator (operational health checks)
- **Frontend**: React 18, Vite 8, Axios (with request & response interceptors), React Toastify, CSS
- **Database**: MySQL 8.0+
- **Testing**: JUnit 5, Mockito, Spring Test (`MockMvc`), AssertJ

---

## 3. Prerequisites

Ensure the following tools are installed on your workstation:
- **Java Development Kit (JDK)**: Java 17 or higher (`java -version`)
- **Node.js**: v18.0.0 or higher (`node -v`) and npm (`npm -v`)
- **MySQL Server**: 8.0 or higher (`mysql --version`)
- **Maven Wrapper**: `.\mvnw.cmd` (Windows) or `./mvnw` (Linux/macOS) included in the repository

---

## 4. Local Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd hospital-management
```

### Step 2: Configure MySQL Database
Start your local MySQL service and create the database:
```sql
CREATE DATABASE hospital_db;
```

### Step 3: Configure Backend Environment Variables
Create a `.env` file in the project root by copying the template:
```bash
# Windows PowerShell
Copy-Item .env.example .env
```
Fill in your local database credentials and secret key in `.env`:
```env
DB_URL=jdbc:mysql://localhost:3306/hospital_db
DB_USERNAME=root
DB_PASSWORD=your_local_password
JWT_SECRET=your_secure_256_bit_jwt_secret_key
JWT_EXPIRATION=86400000
CORS_ALLOWED_ORIGINS=http://localhost:5173
```
*(Note: `.env` is ignored by git and will never be committed).*

### Step 4: Start the Spring Boot Backend
```powershell
# Windows PowerShell
$env:JAVA_HOME = "C:\path\to\your\jdk-17"  # if not globally in PATH
.\mvnw.cmd spring-boot:run
```
By default, the backend starts on `http://localhost:8080` with the `dev` profile.

### Step 5: Configure Frontend Environment Variables
Navigate to the frontend directory and copy the environment template:
```powershell
cd hospital-frontend
Copy-Item .env.example .env
```
Verify `hospital-frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:8080
```

### Step 6: Start the React Frontend
```powershell
npm install
npm run dev
```
Access the application in your browser at `http://localhost:5173`.

---

## 5. Configuration & Profiles

The application utilizes Spring Profiles for environment separation:

| Setting | Development (`dev`) | Production (`prod`) |
|---|---|---|
| **Activation** | Default fallback (`spring.profiles.default=dev`) | Explicit (`SPRING_PROFILES_ACTIVE=prod`) |
| **Credentials** | Reads from `.env` or environment variables | Strictly injected via container/host environment variables |
| **Hibernate DDL** | `ddl-auto=update` | `ddl-auto=validate` (zero automatic schema mutation) |
| **SQL Logging** | `show-sql=true` | `show-sql=false` |
| **Log Levels** | DEBUG for application packages | INFO for application, WARN for framework |

### Required Environment Variables
- `DB_URL`: JDBC connection string (e.g., `jdbc:mysql://db-host:3306/hospital_db`)
- `DB_USERNAME`: Database user
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: Base64/HMAC secret key used for signing and verifying JWT tokens
- `JWT_EXPIRATION`: Token validity in milliseconds (default: `86400000` / 24 hours)
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed frontend origins (default in dev: `http://localhost:5173`)

---

## 6. API Documentation (OpenAPI / Swagger)

When the backend is running locally, access the interactive API documentation at:
- **Swagger UI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **OpenAPI Specification (JSON)**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### Testing Protected Endpoints in Swagger UI:
1. Call `POST /api/auth/login` with valid credentials.
2. Copy the returned `token`.
3. Click the **Authorize** button at the top of Swagger UI.
4. Enter the token into the `bearerAuth` field and click **Authorize**.
5. All subsequent requests in the browser session will include the `Authorization: Bearer <token>` header.

---

## 7. Operational Health Check

Spring Boot Actuator exposes a sanitized health probe for container orchestrators (Kubernetes, AWS ECS) and monitoring:
- **URL**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- **Response**:
```json
{
  "status": "UP",
  "groups": [
    "liveness",
    "readiness"
  ]
}
```
*Sensitive actuator management endpoints (`/actuator/env`, `/actuator/beans`, etc.) are explicitly unexposed.*

---

## 8. Testing & Verification

### Backend Automated Test Suite
Run the complete backend test suite (unit tests, integration tests, concurrency tests):
```powershell
.\mvnw.cmd test
```
The suite executes **62 automated tests**:
- **Service Unit Tests**: Validates business rules, past-date rejections, ownership isolation, status transitions (`AppointmentServiceTest`, `UserServiceTest`, `DoctorServiceTest`, `PatientServiceTest`).
- **Controller Integration Tests**: Validates HTTP status codes, DTO schemas, pagination contracts, and Spring Security filters (`AuthControllerIntegrationTest`, `DoctorControllerIntegrationTest`, `PatientControllerIntegrationTest`, `AppointmentControllerIntegrationTest`).
- **Concurrency Test**: Verifies multi-threaded simultaneous booking collision invariants (`AppointmentConcurrencyTest`).

### Frontend Production Build
To verify the React frontend bundle compiles cleanly:
```powershell
cd hospital-frontend
npm run build
```

---

## 9. Production Configuration Guidelines

Before deploying to a staging or production environment:
1. **Activate Production Profile**: Set `SPRING_PROFILES_ACTIVE=prod`.
2. **Schema Management**: The production profile runs with `spring.jpa.hibernate.ddl-auto=validate`. All production database schema migrations must be applied manually or managed via an external migration pipeline before application launch.
3. **Inject Secrets**: Ensure `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` are passed via secret managers (AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets). Never store production secrets in source control.
4. **CORS Configuration**: Set `CORS_ALLOWED_ORIGINS` to the exact production frontend URL(s) (e.g. `https://hospital.example.com`). Wildcards with credentials are disallowed by Spring Security.
5. **Frontend API Target**: Set `VITE_API_BASE_URL` in the frontend build pipeline to the public HTTPS backend API gateway URL.

---

## 10. Project Structure

```
hospital-management/
├── src/main/java/com/sagarika/hospital/
│   ├── config/            # OpenAPI/Swagger configuration
│   ├── controller/        # REST controllers (Auth, Doctors, Patients, Appointments)
│   ├── dto/               # Request and Response Data Transfer Objects
│   ├── entity/            # JPA entities (User, Patient, Doctor, Appointment)
│   ├── exception/         # GlobalExceptionHandler and custom exceptions
│   ├── repository/        # Spring Data JPA repositories
│   ├── security/          # SecurityConfig, JwtUtil, JwtAuthenticationFilter
│   └── service/           # Business services (Appointment, User, Doctor, Patient)
├── src/main/resources/
│   ├── application.properties       # Base shared configuration (Actuator, Swagger)
│   ├── application-dev.properties   # Local development profile
│   └── application-prod.properties  # Production profile (ddl-auto=validate, no secrets)
├── src/test/java/com/sagarika/hospital/
│   ├── controller/        # MockMvc integration tests with Spring Security
│   └── service/           # Service unit tests and Concurrency invariant test
├── hospital-frontend/
│   ├── src/
│   │   ├── api/           # Centralized Axios instance with auth interceptors
│   │   ├── components/    # Navbar, ProtectedRoute
│   │   ├── context/       # AuthContext for state persistence
│   │   ├── pages/         # Login, Register, Doctors, Appointments, BookAppointment
│   │   └── services/      # API communication services
│   ├── .env.example       # Frontend environment variable template
│   └── package.json       # Dependencies and build scripts
├── .env.example           # Backend environment variable template
├── .gitignore             # Git exclusion rules for secrets, builds, and artifacts
└── pom.xml                # Maven project descriptor
```
