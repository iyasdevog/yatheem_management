# Yatheem Care — Student & Sponsor Management System

A production-ready, full-stack Web Application for orphan/yatheem student management, sponsor slab allocations, QR/manual attendance, multi-ledger voucher accounting, DigiLocker, and comprehensive reporting.

## ✨ Features

- **Student Admissions** — Full cascading geographic address, multi-year educational lineage, photo upload
- **Sponsor & Slab Engine** — Anonymous donor support ("Well-wisher" masking), flexible slab allocations
- **QR + Manual Attendance** — Dual-mode logging with mandatory leave reason
- **Multi-Ledger Vouchers** — Student expense headings + Yatheem common operational costs, printable receipts
- **Student Utility Portal** — DigiLocker, camera mark list upload with approval workflow, reimbursements
- **Reports & Analytics** — Dashboard KPIs, sponsor execution history, attendance summaries, JSON export
- **Legacy Excel Migration** — Drag-drop XLSX import with dirty record review
- **Environment-Agnostic Storage** — Switch between Local / Firebase / AWS S3 via env variable

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Database | SQLite (dev) / PostgreSQL (prod), Prisma ORM v5 |
| Auth | JWT (jose), bcryptjs, RBAC (ADMIN / OFFICE_STAFF / SPONSOR / STUDENT_FAMILY) |
| Storage | Adapter pattern — Local \| Firebase \| AWS S3 |
| Icons | Lucide React |

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env.local
# Edit .env.local with your settings

# 3. Push database schema & seed demo data
npm run db:push
npm run db:seed

# 4. Start development server
npm run dev
# → http://localhost:3000
```

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@yatheemcare.org` | `admin123` |
| Office Staff | `staff@yatheemcare.org` | `password123` |
| Sponsor | `sponsor@yatheemcare.org` | `password123` |
| Student/Family | `family@yatheemcare.org` | `password123` |

## 🔧 Environment Variables

```bash
# .env.local

STORAGE_PROVIDER=local          # local | firebase | s3
JWT_SECRET=your_strong_secret_here
DATABASE_URL="file:./prisma/dev.db"

# Firebase (if STORAGE_PROVIDER=firebase)
# FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# AWS S3 (if STORAGE_PROVIDER=s3)
# AWS_REGION=ap-south-1
# AWS_S3_BUCKET_NAME=your-bucket
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
```

## 📂 Project Structure

```
src/
├── lib/
│   ├── auth.ts                    # JWT + RBAC helpers
│   ├── db.ts                      # Prisma singleton
│   ├── importLegacyExcel.ts       # Excel ETL engine
│   └── storage/                   # IStorageService + adapters
├── app/
│   ├── page.tsx                   # Main app (role-based routing)
│   └── api/                       # All API routes
└── components/                    # All UI modules
prisma/
├── schema.prisma                  # 14 models, fully indexed
└── seed.ts                        # Demo data seeder
scripts/
└── import-excel-legacy.ts         # CLI Excel migration
```

## 📜 Available Scripts

```bash
npm run dev           # Development server
npm run build         # Production build
npm run db:push       # Sync Prisma schema to DB
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio
npm run import:legacy # Run legacy Excel import via CLI
```

## 📋 RBAC Access Matrix

| Module | ADMIN | OFFICE_STAFF | SPONSOR | STUDENT_FAMILY |
|--------|-------|-------------|---------|----------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Student Admission | ✅ | ✅ | — | — |
| Sponsors & Slabs | ✅ | ✅ | ✅ | — |
| QR Attendance | ✅ | ✅ | — | ✅ |
| Vouchers | ✅ | ✅ | — | — |
| Student Portal | ✅ | ✅ | — | ✅ |
| Reports | ✅ | ✅ | ✅ | — |
| Excel Migration | ✅ | — | — | — |

## 🗄️ Storage Architecture

> **Key Rule:** Only relative paths (e.g. `students/photos/photo.jpg`) are stored in the database. Dynamic URLs are resolved on demand via `/api/storage/file/[...key]`.

```
STORAGE_PROVIDER=local    → public/uploads/  (zero cost, dev default)
STORAGE_PROVIDER=firebase → Firebase Cloud Storage
STORAGE_PROVIDER=s3       → AWS S3 (or MinIO)
```

## 📄 License

MIT
