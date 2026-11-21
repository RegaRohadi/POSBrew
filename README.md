# POSBrew

Point of sale untuk coffee shop: kasir, stok, resep, dan laporan dalam satu aplikasi. Backend Go + Gin + PostgreSQL, frontend React + TypeScript dengan UI bilingual (Indonesia/English).

![Dashboard POSBrew](docs/screenshots/dashboard-id.png)

| Kasir | Laporan |
|-------|---------|
| ![POS](docs/screenshots/pos.png) | ![Reports](docs/screenshots/reports.png) |

## Fitur

- **POS / kasir**: katalog produk dengan foto menu, pencarian, filter kategori, cart, diskon, pembayaran tunai/QRIS/debit, kembalian, dan struk siap cetak.
- **Foto produk**: 12 menu demo memakai foto lokal di `frontend/public/products`; produk baru bisa memakai URL gambar atau foto bawaan yang dicocokkan dari nama.
- **Stok otomatis**: penjualan memotong stok ingredient sesuai resep; pembatalan transaksi mengembalikan stok lewat movement `reversal`.
- **Inventori**: pembelian, waste, stock opname, riwayat pergerakan, dan peringatan stok menipis.
- **Resep**: komposisi ingredient per produk, dipakai untuk kalkulasi stok.
- **Laporan**: ringkasan hari ini/bulan ini, pendapatan harian, produk terlaris, stok menipis.
- **Auth & role**: JWT, bcrypt, role `admin` dan `cashier`.
- **Bilingual**: seluruh UI Indonesia/English, pilihan bahasa tersimpan di browser.
- **Responsive**: sidebar desktop yang bisa diciutkan (preferensi tersimpan di browser), drawer mobile, dan ringkasan cart yang selalu terlihat di mobile.
- **Demo data**: seeder membuat 12 menu, 11 ingredient, resep, dan 32 transaksi 14 hari terakhir.

## Tech stack

| Backend | Frontend |
|---------|----------|
| Go 1.27 | React 19 + TypeScript |
| Gin | Vite |
| GORM + PostgreSQL 17 | Tailwind CSS 4 |
| JWT + bcrypt | TanStack Query + Axios |
| shopspring/decimal | Zustand, React Router, Recharts |
| | i18next, Sonner, Lucide |

## Struktur

```
backend/                   Go API + Gin
├── cmd/
│   ├── api/               entrypoint HTTP API
│   └── seed/              demo seeder
├── internal/              config, database, router, middleware, modules
├── migrations/            schema + seed role/unit
├── .air.toml              live reload mode development
└── Dockerfile
frontend/                  React app
├── public/brand/          logo mark & favicon
├── scripts/               smoke test, i18n check, screenshot
├── src/                   features, components, i18n, lib, stores
└── Dockerfile
docs/screenshots/          screenshot untuk dokumentasi
docs/image-credits.md      sumber dan lisensi foto demo
docs/prd-playbook.md       template PRD umum + checklist modularity & engineering
docker-compose.yml         postgres + api + frontend production
docker-compose.override.yml  api mode dev (air) + port postgres
```

## Menjalankan

### 1. Satu perintah untuk backend + frontend

```bash
docker compose up -d --build
```

Compose langsung menyalakan PostgreSQL, API (Air, hot reload), dan frontend (Vite, hot reload). Frontend memakai port **3001**, bukan 3000.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| API | http://localhost:8080/api/v1 |
| PostgreSQL | localhost:5432 |

Jika database masih kosong, jalankan migrasi (lihat bagian berikut). `WEB_PORT` bisa diubah di `.env`.

### 2. Frontend di host (opsional)

Backend + database tetap lewat Docker:

```bash
docker compose up -d postgres api
```

Lalu jalankan frontend langsung di host:

```bash
cd frontend
npm install
npm run dev
```

Vite berjalan di `http://localhost:5173` dan mem-proxy `/api` ke `http://localhost:8080`.

### 3. Migrasi database

Dengan `golang-migrate`:

```bash
migrate -path backend/migrations \
  -database "postgres://postgres:postgres123@localhost:5432/posbrew?sslmode=disable" up
```

Atau psql di container (PowerShell):

```powershell
Get-Content backend/migrations/000001_init_schema.up.sql | docker compose exec -T postgres psql -U postgres -d posbrew
Get-Content backend/migrations/000002_seed_master_data.up.sql | docker compose exec -T postgres psql -U postgres -d posbrew
```

Migrasi kedua mengisi role `admin`/`cashier` dan unit `g`, `kg`, `ml`, `L`, `pcs`.

### 4. Seed data demo

```bash
cd backend
go run ./cmd/seed
```

Atau di container dev:

```bash
docker compose exec api go run ./cmd/seed
```

Seed bersifat idempotent. Untuk menghapus seluruh data bisnis dan seed ulang:

```bash
cd backend
go run ./cmd/seed -reset
```

### Akun demo

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@posbrew.test` | `admin123` |
| Kasir | `cashier@posbrew.test` | `cashier123` |

Kalau seed tidak dipakai: **user pertama yang register lewat API otomatis menjadi admin**, user berikutnya menjadi cashier.

## Environment

Salin `.env.example` ke `.env` lalu sesuaikan.

| Variable | Default | Keterangan |
|----------|---------|------------|
| `APP_PORT` | `8080` | Port API |
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_USER` | `postgres` | User database |
| `DB_PASSWORD` | – | Password database |
| `DB_NAME` | `posbrew` | Nama database |
| `DB_SSLMODE` | `disable` | SSL mode |
| `JWT_SECRET` | dev secret | **Wajib diganti di production** |
| `JWT_EXPIRE_HOURS` | `24` | Masa berlaku token |
| `WEB_PORT` | `3001` | Port frontend di host (bukan 3000) |

## Frontend

```bash
cd frontend
npm run dev          # development
npm run build        # production build
npm run typecheck    # TypeScript
npm run check:i18n   # validasi key ID/EN
npm run smoke        # smoke test Playwright (butuh API + dev server)
```

Smoke test memakai Microsoft Edge (`channel: msedge`). Pastikan backend dan Vite dev server sudah berjalan.

## Brand

Logo POSBrew berupa coffee bean monogram dengan dua garis uap, warna espresso `#221913`, cream `#F7F2EC`, dan caramel `#9C4A2F`. Asset:

- `frontend/public/brand/logo-mark.svg` — favicon dan app icon
- `frontend/src/components/layout/logo.tsx` — logo mark + wordmark di UI

Font: **Poppins** untuk UI, heading, dan angka; **Fraunces** dipakai untuk wordmark brand POSBrew.

Foto produk demo tersimpan di `frontend/public/products/` (12 menu) dan dipakai otomatis lewat `image_url` atau pencocokan nama produk. Latar panel login memakai `frontend/public/brand/cafe-interior.jpg`. Sumber dan lisensi ada di `docs/image-credits.md`.

## API

Semua response:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

### Public

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/register` | Daftar (user pertama = admin) |
| POST | `/api/v1/auth/login` | Login, dapat token JWT |

### Butuh token (admin & cashier)

Header: `Authorization: Bearer <token>`

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/v1/auth/me` | Profile user aktif |
| GET | `/api/v1/categories` | List kategori |
| GET | `/api/v1/categories/:id` | Detail kategori |
| GET | `/api/v1/products` | List produk (search, filter, pagination) |
| GET | `/api/v1/products/:id` | Detail produk |
| GET | `/api/v1/units` | List unit |
| GET | `/api/v1/units/:id` | Detail unit |
| GET | `/api/v1/ingredients` | List ingredient (search, low_stock) |
| GET | `/api/v1/ingredients/:id` | Detail ingredient |
| GET | `/api/v1/recipes?product_id=1` | Resep sebuah produk |
| GET | `/api/v1/recipes/:id` | Detail resep |
| GET | `/api/v1/stock-movements` | Riwayat stok |
| GET | `/api/v1/transactions` | List transaksi |
| GET | `/api/v1/transactions/:id` | Detail transaksi |
| POST | `/api/v1/transactions` | Buat penjualan |

### Admin only

| Method | Path | Keterangan |
|--------|------|------------|
| POST/PUT/DELETE | `/api/v1/categories` | CRUD kategori |
| POST/PUT/DELETE | `/api/v1/products` | CRUD produk |
| POST/PUT/DELETE | `/api/v1/units` | CRUD unit |
| POST/PUT/DELETE | `/api/v1/ingredients` | CRUD ingredient |
| POST/PUT/DELETE | `/api/v1/recipes` | CRUD resep |
| POST | `/api/v1/stock-movements` | Purchase/waste/adjustment |
| DELETE | `/api/v1/transactions/:id` | Batalkan transaksi |
| GET/POST/PUT/DELETE | `/api/v1/users` | Manajemen user |
| GET | `/api/v1/roles` | List role |
| GET | `/api/v1/reports/summary` | Ringkasan penjualan |
| GET | `/api/v1/reports/sales` | Penjualan harian |
| GET | `/api/v1/reports/top-products` | Produk terlaris |
| GET | `/api/v1/reports/low-stock` | Stok menipis |

### Query params

- Produk: `page`, `limit`, `search`, `category_id`, `is_available`.
- Ingredient: `page`, `limit`, `search`, `is_active`, `low_stock=true`.
- Stock movement: `page`, `limit`, `ingredient_id`, `type`.
- Transaksi: `page`, `limit`, `status`, `user_id`, `date_from=YYYY-MM-DD`, `date_to=YYYY-MM-DD`.
- Laporan: `from`, `to`, `limit` (top products).

## Contoh transaksi

```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 2, "quantity": 1}
    ],
    "discount": 2000,
    "payment_method": "cash",
    "payment_amount": 100000
  }'
```

Server menghitung subtotal dari harga database, memvalidasi stok, memotong stok ingredient sesuai resep, membuat payment, dan menghasilkan invoice dalam satu database transaction.

## Catatan stok

| Tipe | Arti |
|------|------|
| `purchase` | `quantity` ditambahkan ke stok |
| `waste` | `quantity` dikurangi dari stok (ditolak jika stok kurang) |
| `adjustment` | stok diset ke `target_stock`, selisih dicatat sebagai movement |
| `sale` | dibuat otomatis saat transaksi |
| `reversal` | dibuat otomatis saat transaksi dibatalkan |

Semua perubahan stok memakai `SELECT ... FOR UPDATE` di dalam database transaction, jadi aman saat beberapa kasir menjual produk yang sama bersamaan.

## Catatan production

- Ganti `JWT_SECRET` dan kredensial database.
- Jalankan production tanpa override development: `docker compose -f docker-compose.yml up -d --build`.
- Frontend production di-serve Nginx dan mem-proxy `/api` ke service `api`, jadi tidak perlu CORS.
- Token disimpan di `localStorage` (cocok untuk demo/portfolio). Untuk production yang lebih ketat, pertimbangkan httpOnly cookie.
- Migrasi tidak dijalankan otomatis oleh container; jalankan sebelum aplikasi dipakai.
