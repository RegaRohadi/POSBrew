# PRD & Engineering Playbook — General

Template PRD dan checklist engineering untuk project software apa pun: web, mobile,
desktop, API, data, atau internal tools. Dokumen ini merangkum preferensi yang muncul
di project POSBrew, lalu menggeneralisasikannya agar bisa dipakai ulang.

**Cara pakai:** salin bagian **3. Template PRD**, isi bagian yang relevan, lalu jadikan
bagian **4–8** sebagai quality gate sebelum rilis.

---

## 1. Prinsip yang diambil dari project ini

1. **Mulai dari standar yang diakui** — untuk UI gunakan Apple HIG atau design system
   lain yang jelas; untuk engineering gunakan boundary, contract, dan quality gate
   yang eksplisit.
2. **Desain adalah sistem**, bukan daftar halaman. Token warna, tipografi, spacing,
   radius, dan komponen harus konsisten dan bisa dipakai ulang.
3. **Gunakan konten nyata** — foto, data, dan copy yang sebenarnya. Placeholder hanya
   untuk state loading/empty, bukan untuk tampilan utama.
4. **Semua state harus dirancang** — loading, empty, error, success, offline, permission
   denied, data panjang, dan viewport pendek.
5. **Navigasi harus beradaptasi** — sidebar/drawer, collapse, preferensi yang tersimpan,
   dan shortcut yang jelas.
6. **Modular berdasarkan capability**, bukan sekadar folder `controllers/services`.
7. **Kontrak di setiap boundary** — API, module, event, database. Jangan biarkan modul
   lain mengakses internal secara langsung.
8. **Otomatiskan kualitas** — lint, typecheck, test, build, smoke, dan dokumentasi
   dijalankan sebelum rilis.
9. **Dokumentasikan keputusan penting** — ADR, API spec, runbook, dan kredit aset.

---

## 2. Ringkasan saran user (digeneralisasi)

| Saran di POSBrew | Generalisasi untuk project lain | Bukti / acceptance |
|------------------|---------------------------------|--------------------|
| Pakai Apple Design Skill/HIG | Pilih satu standar desain dan review terhadap standar itu | Checklist audit UI terisi |
| Perbaiki font & layout | Tipografi, hierarki, spacing, dan layout adalah prioritas, bukan sekadar warna | Type scale + layout responsif |
| Foto untuk semua produk | Semua entitas utama punya aset/konten nyata, bukan ikon generik | Tidak ada placeholder di core flow |
| Font sama dengan referensi | Referensi visual harus eksplisit; font, ukuran, dan weight ditentukan di PRD | Token font + screenshot review |
| Cart kosong kurang bagus | UI harus state-driven; kontrol yang tidak relevan disembunyikan | Empty state tidak menampilkan form pembayaran |
| Sidebar bisa di-collapse | Navigasi adaptif + preferensi pengguna tersimpan | Collapse/expand, reload, mobile tetap benar |
| (implisit) modular | Modul per capability, boundary jelas, dependency satu arah | Arch test/lint dependency lulus |
| (implisit) dokumentasi | PRD, ADR, API spec, runbook, kredit aset | Dokumen ada dan diperbarui |
| (implisit) verifikasi | Quality gate otomatis dan uji manual skenario kritis | CI + smoke + cek viewport |

---

## 3. Template PRD

### 3.1 Metadata
- **Nama produk:**
- **Owner / tim:**
- **Status:** draft / review / approved / implemented
- **Versi & tanggal:**
- **Link desain / Figma:**
- **Link tech spec / ADR:**

### 3.2 Problem & konteks
- **Problem yang diselesaikan:**
- **Kondisi saat ini:**
- **Mengapa sekarang:**
- **Asumsi penting:**

### 3.3 Tujuan, non-goals, metrik
- **Tujuan:**
  - [ ] ...
- **Non-goals:**
  - [ ] ...
- **Metrik sukses:**
  - [ ] ...
- **Guardrail metric:** (contoh: error rate, p95 latency, conversion tidak turun)

### 3.4 User & skenario
- **Persona / role:**
- **Job-to-be-done utama:**
- **Skenario kritis:**
  1. ...
  2. ...
- **Skenario yang harus gagal dengan aman:**
  1. ...

### 3.5 Scope & functional requirements
Gunakan ID agar bisa dilacak ke test.

| ID | Requirement | Prioritas | Acceptance |
|----|-------------|-----------|------------|
| FR-1 | ... | must | ... |
| FR-2 | ... | should | ... |
| FR-3 | ... | could | ... |

### 3.6 Non-functional requirements
| Area | Target |
|------|--------|
| Performance | p95 API < ... ms; LCP < ... s; bundle < ... KB |
| Reliability | uptime, retry, idempotency, backup, recovery |
| Security | authN/authZ, validasi input, secret management, rate limit, audit log |
| Privacy | data minimization, retensi, akses, logging data sensitif |
| Accessibility | kontras ≥ 4.5:1, keyboard, focus, label, reduced motion |
| i18n | tidak ada copy hardcoded; key ID/EN lengkap |
| Observability | structured log, metrics, tracing, health check, alert |
| Maintainability | lint/typecheck/test, dependency rule, dokumentasi |

### 3.7 UX & design direction
- **3 kata brand:**
- **Referensi visual:** (link + font yang dipakai)
- **Anti-reference:**
- **Font UI:** (project ini: Poppins 400–700)
- **Font brand/display:** (project ini: serif untuk wordmark)
- **Palette & peran warna:**
- **State wajib:** loading / empty / error / success / disabled / offline
- **Prinsip penting:**
  - Aksi kritis selalu terlihat tanpa scroll.
  - Empty state menggantikan kontrol yang tidak relevan.
  - Foto/aset nyata untuk semua entitas utama.
  - Teks fungsional minimal 11–12px; body 15–16px.
  - Angka uang memakai tabular numerals.

### 3.8 Data & aset
- **Sumber data:**
- **Sumber gambar/aset + lisensi:**
- **Format & ukuran:**
- **Fallback bila aset gagal dimuat:**
- **Seed/demo data:** idempotent, aman dijalankan berulang
- **Kredit aset:** path dokumen

### 3.9 Architecture & modularity
Isi module map sebelum menulis kode.

| Module | Tanggung jawab | Data yang dimiliki | Public contract | Depends on |
|--------|----------------|--------------------|-----------------|------------|
| ... | ... | ... | ... | ... |

Aturan yang disepakati:
- [ ] Modul disusun per **business capability**, bukan per tipe file.
- [ ] Setiap modul punya **public API** kecil; internal tidak diimpor dari luar.
- [ ] Dependency satu arah: UI/adapters → application → domain.
- [ ] Domain tidak bergantung pada framework, ORM, atau UI.
- [ ] Tidak ada **circular dependency**; ditegakkan oleh lint/arch test.
- [ ] Tabel database punya satu modul pemilik; modul lain lewat contract.
- [ ] DTO/API model terpisah dari model persistence.
- [ ] Transaksi menjaga invariant bisnis; operasi kritis idempotent.
- [ ] Side effect async memakai queue/outbox, retry, dan dead-letter.
- [ ] Konfigurasi lewat env; secret tidak masuk repo.
- [ ] Migrasi forward-only, reviewable, punya rencana rollback.
- [ ] Shared code dipromosikan hanya jika stabil dan dipakai ≥ 2 modul.
- [ ] Feature flag/plugin point hanya jika ada kebutuhan nyata.
- [ ] ADR dibuat untuk keputusan arsitektur yang signifikan.

### 3.10 Operasi & rilis
- **Rollout plan:** feature flag / canary / bertahap
- **Migrasi data:**
- **Rollback plan:**
- **Monitoring & alert:**
- **Runbook:**
- **Rencana komunikasi:**

### 3.11 Risiko & pertanyaan terbuka
| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| ... | ... | ... |

- **Open questions:**
  1. ...
  2. ...

### 3.12 Acceptance criteria
Tulis dalam format yang bisa diuji:
- [ ] Given ..., when ..., then ...
- [ ] Given cart kosong, when dibuka, then tidak ada kontrol pembayaran.
- [ ] Given sidebar collapsed, when reload, then state tetap collapsed.
- [ ] Given viewport 1366×768, when cart berisi, then total/kembalian/checkout terlihat.
- [ ] Given semua produk, when katalog dibuka, then semua menampilkan foto.
- [ ] Given modul baru, when ditambahkan, then tidak ada modul lain yang perlu diubah
      selain composition root.
- [ ] Given API error, when terjadi, then response memakai envelope dan pesan yang jelas.

---

## 4. Checklist modularity

- [ ] Module map dan ownership data sudah disepakati.
- [ ] Public contract tiap modul terdokumentasi.
- [ ] Tidak ada import ke folder internal modul lain.
- [ ] Dependency graph tidak punya cycle.
- [ ] Domain layer bebas framework/ORM.
- [ ] Cross-module write tidak langsung ke database.
- [ ] Error contract dan validasi konsisten di boundary.
- [ ] Ada mekanisme migrasi + seed idempotent.
- [ ] Ada strategi idempotency untuk pembayaran/job.
- [ ] Ada observability: log, metric, trace, health.
- [ ] Ada ADR untuk keputusan besar.
- [ ] Ada contoh penambahan modul/fitur baru tanpa menyentuh modul lain.

---

## 5. Checklist kualitas engineering

- [ ] Format dan lint lolos.
- [ ] Typecheck lolos.
- [ ] Unit test untuk aturan domain.
- [ ] Integration test untuk boundary penting.
- [ ] Contract test untuk API/event.
- [ ] E2E/smoke untuk alur kritis.
- [ ] Build production lolos.
- [ ] Migrasi diuji di database bersih.
- [ ] Dependency/security scan.
- [ ] Tidak ada secret di repo.
- [ ] Error handling dan logging teruji.
- [ ] Performance budget terukur.
- [ ] Dokumentasi/API spec/runbook diperbarui.
- [ ] Screenshot/demo diperbarui.

---

## 6. Checklist UI/UX (ringkas)

- [ ] Satu `h1` per halaman; hierarki heading benar.
- [ ] Body ≥ 15px; label kecil ≥ 11–12px.
- [ ] Kontras teks ≥ 4.5:1; status tidak hanya lewat warna.
- [ ] Target kontrol 44×44px; kontrol kecil ≥ 28×28px.
- [ ] Focus ring terlihat; navigasi keyboard berfungsi.
- [ ] `aria-label` untuk kontrol ikon; tooltip saat icon-only.
- [ ] Empty state, loading, error, dan success dirancang.
- [ ] Aksi kritis tidak tersembunyi di bawah fold.
- [ ] Foto/aset nyata untuk semua entitas utama.
- [ ] Responsif di 1024, 1280, 1440, 1920, dan 1366×768.
- [ ] Tidak ada horizontal overflow.
- [ ] Preferensi UI (bahasa, sidebar, tema) tersimpan bila relevan.
- [ ] `prefers-reduced-motion` dihormati.

---

## 7. Do / Don't

| Do | Don't |
|----|-------|
| Modul per capability dengan contract jelas | Folder `utils` menjadi tempat sampah |
| Dependency satu arah dan tanpa cycle | Modul saling import internal |
| DTO/API model terpisah dari persistence | Model database bocor ke API/UI |
| Test alur kritis end-to-end | Hanya mengandalkan manual test |
| Seed idempotent dan non-destruktif | Seed yang menghapus data tanpa flag eksplisit |
| Empty state menggantikan kontrol tidak relevan | Menumpuk form di atas empty state |
| Total/kembalian/checkout selalu terlihat | Checkout tersembunyi di bawah fold |
| Foto asli + fallback + kredit | Placeholder ikon di core flow |
| Font/aset di-host lokal | Bergantung CDN saat demo offline |
| ADR dan runbook diperbarui | Keputusan besar hanya ada di chat |
| Observability sejak awal | Logging hanya `console.log` tersebar |

---

## 8. Definition of Done

- [ ] Semua acceptance criteria terpenuhi.
- [ ] NFR (performance, security, accessibility, i18n) terukur.
- [ ] Checklist modularity terpenuhi.
- [ ] Checklist kualitas engineering terpenuhi.
- [ ] Checklist UI/UX terpenuhi.
- [ ] Migrasi + rollback plan siap.
- [ ] Monitoring/alert/runbook siap.
- [ ] Dokumentasi dan kredit aset diperbarui.
- [ ] Screenshot/demo dan release notes diperbarui.
- [ ] Tidak ada open question yang memblokir rilis.
