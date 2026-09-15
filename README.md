# SWA Pertanian — POS ERP V1

POS + mini ERP berbasis GitHub Pages + Google Apps Script + Google Sheets.

## Fitur V1
- Dashboard KPI
- POS / Penjualan
- Master Produk / Item
- Master Customer
- Invoice
- Pembayaran, DP, pelunasan, kwitansi
- Piutang
- Stok otomatis saat penjualan
- Stok masuk / keluar manual
- Produk stok menipis
- Laporan ringkas

## Sheet yang digunakan
Existing:
- INVOICE
- INVOICE_DETAIL
- CUSTOMER
- SETTINGS

Otomatis dibuat jika belum ada:
- PAYMENT
- PRODUCT
- STOCK_MOVEMENT

### PRODUCT
Header: Product ID, Kode Produk, Nama Produk, Kategori, Satuan, Harga Beli, Harga Jual, Stok, Minimum Stok, Supplier, Aktif

### STOCK_MOVEMENT
Header: Movement ID, Tanggal, Product ID, Kode Produk, Nama Produk, Tipe, Qty, Referensi, Catatan

## Backend
Ganti Code.gs di Apps Script dengan file Code.gs ini, lalu deploy sebagai Web App.
Execute as: Me.
Who has access: Anyone (sesuaikan kebijakan akses).
Setelah perubahan Code.gs, buat deployment/version baru.

## Frontend
Upload index.html, css/style.css, js/app.js ke GitHub Pages.
API URL sudah diarahkan ke Web App SWA Pertanian.
