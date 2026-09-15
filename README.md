# SWA Pertanian — Invoice Manager

Frontend GitHub Pages untuk invoice berbasis Google Sheets + Google Apps Script.

## Backend API

`js/app.js` sudah menggunakan Apps Script Web App:

https://script.google.com/macros/s/AKfycbxkKovujMdEdhLqPkYp24adCWmBcX06s-HE3PVXJML36ORlOmH27n1qjKB08kBYZ429kA/exec

## Struktur

```text
swa-pertanian-invoice/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## Catatan

- Tidak menggunakan logo perusahaan.
- Branding aplikasi: SWA Pertanian.
- Nuansa visual biru-putih bergaya corporate/agriculture.
- Website field tidak ditampilkan di invoice.
- Backend mengharapkan sheet yang sama dengan template Invoice: `INVOICE`, `INVOICE_DETAIL`, `CUSTOMER`, `SETTINGS`.
- `getInitialData` harus mengembalikan `customers`, `invoices`, dan `settings`.
- Penyimpanan invoice menggunakan payload `{ action: 'saveInvoice', invoice: {...} }`.
