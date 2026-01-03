# Static-Site Manual Checklist

Gunakan checklist ini untuk Phase 10.3 dan 10.4.

## 10.3 Manual Testing Checklist

- Buka `generated/static-no-enhance/dist/index.html` langsung dari file system (tanpa server).
- Buka `generated/static-with-enhance/dist/index.html` langsung dari file system.
- Matikan JavaScript di browser lalu refresh:
  - Konten masih terbaca.
  - Navigasi sidebar tetap terlihat.
  - Code block tetap tampil.
- Nyalakan JavaScript:
  - Sidebar toggle bekerja.
  - Copy code bekerja.
  - Theme toggle bekerja.
  - TOC scroll spy highlight berjalan.
  - Search bekerja (jika mode `client_index`).
- Semua link internal bisa dibuka.
- `sitemap.xml` dan `robots.txt` tersedia (jika policy enabled).

## 10.4 Integration with irgen Docs

- Generate: `npm run gen:static-docs`
- Buka `generated/static-docs/dist/index.html`
- Validasi:
  - Load cepat.
  - Navigasi sidebar berjalan (JS on).
  - Code block enak dibaca + copy.
  - JS off tetap terbaca dan navigable.
