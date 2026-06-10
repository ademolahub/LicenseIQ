# LicenseIQ

**Microsoft 365 License Optimization & Tenant Health Assessment Tool**

LicenseIQ connects to your Microsoft 365 tenant, identifies wasted licenses, scores your tenant health, and generates actionable PDF reports — without modifying anything in your tenant.

---

## Architecture Overview

```
licenseiq/
├── frontend/       React 18 + Vite + TypeScript  (port 5173)
├── backend/        Node 20 + Express + TypeScript (port 3001)
├── worker/         Node queue worker (polls Azure Storage Queue)
└── shared/         Shared TypeScript types (no runtime dep)
```

**Storage layer (Azure):**
- Table Storage: `Tenants`, `AssessmentsIndex`, `TenantSettings`
- Blob Storage: `assessments/{tenantId}/{runId}.json`, `reports/{tenantId}/{runId}.pdf`
- Queue: `assessments`

---

## Quick Start — MOCK MODE (no Azure credentials needed)

This runs the full app with 47 synthetic users and injected waste scenarios.

### 1. Clone and install

```bash
git clone <repo-url>
cd licenseiq
npm install
```

### 2. Set up environment files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env

# Worker
cp worker/.env.example worker/.env
```

All `.env` files default to `MOCK_MODE=true`. No changes needed for mock mode.

### 3. Run backend

```bash
cd backend
npm run dev
```

Verify: `GET http://localhost:3001/health` → `{ "status": "ok" }`

### 4. Run worker (separate terminal)

```bash
cd worker
npm run start
```

### 5. Run frontend (separate terminal)

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` → click **Connect (Mock)** → explore the dashboard.

---

## Running with Real Microsoft 365 Credentials

### Azure App Registration (read-only)

1. Go to [portal.azure.com](https://portal.azure.com) → Azure Active Directory → App registrations → New registration
2. Set redirect URI to `http://localhost:5173` (or your production URL)
3. Under **API permissions**, add these **delegated** permissions:
   - `User.Read.All`
   - `Directory.Read.All`
   - `Organization.Read.All`
   - `AuditLog.Read.All` (for signInActivity — requires P1/P2)
4. Grant admin consent

### Backend environment (real mode)

```env
MOCK_MODE=false
AZURE_CLIENT_ID=<your-app-client-id>
AZURE_CLIENT_SECRET=<your-app-client-secret>
AZURE_TENANT_ID=<your-tenant-id>
AZURE_STORAGE_CONNECTION_STRING=<your-storage-connection-string>
AZURE_KEYVAULT_URL=https://your-keyvault.vault.azure.net/
FRONTEND_URL=http://localhost:5173
```

### Frontend environment (real mode)

```env
VITE_MOCK_MODE=false
VITE_AZURE_CLIENT_ID=<your-app-client-id>
VITE_AZURE_TENANT_ID=<your-tenant-id>
VITE_AZURE_REDIRECT_URI=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3001
```

---

## Environment Variable Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MOCK_MODE` | Yes | `true` | Skip all Azure/Graph calls |
| `PORT` | No | `3001` | Express server port |
| `AZURE_STORAGE_CONNECTION_STRING` | Real mode | — | Azure Storage account |
| `AZURE_KEYVAULT_URL` | Real mode | — | Key Vault for secrets |
| `AZURE_CLIENT_ID` | Real mode | — | Entra app client ID |
| `AZURE_CLIENT_SECRET` | Real mode | — | Entra app secret |
| `AZURE_TENANT_ID` | Real mode | — | Your Entra tenant ID |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS origin |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_MOCK_MODE` | Yes | `true` | Bypass MSAL login |
| `VITE_AZURE_CLIENT_ID` | Real mode | — | Entra app client ID |
| `VITE_AZURE_TENANT_ID` | Real mode | — | Your Entra tenant ID |
| `VITE_AZURE_REDIRECT_URI` | Real mode | `http://localhost:5173` | OAuth redirect |
| `VITE_API_BASE_URL` | No | `http://localhost:3001` | Backend URL |

---

## API Reference (brief)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `POST` | `/api/assessments/start` | Queue a new assessment |
| `GET` | `/api/assessments/status/:runId` | Poll assessment status |
| `GET` | `/api/assessments/latest` | Latest completed snapshot |
| `GET` | `/api/assessments/runs` | List all past runs |
| `GET` | `/api/settings` | Get tenant settings |
| `PUT` | `/api/settings` | Update tenant settings |
| `POST` | `/api/reports/generate` | Generate PDF report |

---

## Build Parts Progress

| Part | Description | Status |
|------|-------------|--------|
| 1 | Scaffold & Dependencies | ✅ |
| 2 | Backend Foundation | ⬜ |
| 3 | Azure Storage Layer | ⬜ |
| 4 | Mock Graph Service | ⬜ |
| 5 | Waste Engine | ⬜ |
| 6 | Savings Calculator & Health Score | ⬜ |
| 7 | Assessment Runner & Worker | ⬜ |
| 8 | API Endpoints | ⬜ |
| 9 | PDF Report Generation | ⬜ |
| 10 | Frontend Foundation | ⬜ |
| 11 | Connect Page | ⬜ |
| 12 | Dashboard Page | ⬜ |
| 13 | Reports Page | ⬜ |
| 14 | Polish & E2E | ⬜ |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TypeScript, MSAL |
| Backend | Node 20, Express, TypeScript, Zod, Pino |
| Worker | Node 20, TypeScript (queue polling) |
| Storage | Azure Table Storage, Blob Storage, Queue |
| PDF | Puppeteer (server-side HTML → PDF) |
| Auth | Microsoft Entra ID (MSAL, delegated scopes) |

---

## License

MIT — built for demonstration and internal tooling purposes.
