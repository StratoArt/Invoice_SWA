# SWA Pertanian + Strato Art Studio — Business Manager

Satu frontend untuk dua entity dengan database Google Sheets yang berbeda.

## Entity
- SWA Pertanian → Apps Script SWA
- Strato Art Studio → Apps Script Strato

Switch entity di dropdown kanan atas. API URL dan logo berubah otomatis.

## Apps Script
Kedua spreadsheet harus memakai struktur: INVOICE, INVOICE_DETAIL, CUSTOMER, SETTINGS. Backend POS/ERP yang disertakan juga otomatis membuat PAYMENT, PRODUCT, STOCK_MOVEMENT bila belum ada.

### SWA
Gunakan Code.gs yang sekarang sudah terpasang pada deployment SWA.

### Strato
Replace Code.gs Strato dengan `Code.gs` dari paket ini, lalu deploy sebagai Web App (Execute as Me, akses sesuai kebutuhan). Ini menyamakan API Strato dengan API ERP SWA.

## Frontend
Upload seluruh isi folder ke GitHub Pages, termasuk `assets/StratoArtStudio.svg`.
