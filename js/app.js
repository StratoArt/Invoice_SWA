const API_URL = 'https://script.google.com/macros/s/AKfycbxkKovujMdEdhLqPkYp24adCWmBcX06s-HE3PVXJML36ORlOmH27n1qjKB08kBYZ429kA/exec';

const APP = {
  customers: [],
  invoices: [],
  settings: {}
};

const $ = id => document.getElementById(id);


document.addEventListener('DOMContentLoaded', () => {
  $('newInvoiceBtn').onclick = openNewInvoice;
  $('refreshBtn').onclick = loadData;
  $('addItemBtn').onclick = () => addItem();
  $('saveBtn').onclick = saveInvoice;
  $('printBtn').onclick = () => window.print();
  $('searchInput').oninput = filterInvoices;
  $('customerSelect').onchange = selectCustomer;
  $('taxPercent').oninput = calculate;

  document.querySelectorAll('[data-close]').forEach(button => {
    button.onclick = () => closeModal(button.dataset.close);
  });

  $('invoiceDate').value = todayLocal();
  loadData();
});


async function api(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  });

  if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

  const data = await response.json();
  if (data.success === false) {
    throw new Error(data.message || data.error || 'API error');
  }
  return data;
}


async function loadData() {
  try {
    const data = await api('getInitialData');
    APP.customers = data.customers || [];
    APP.invoices = data.invoices || [];
    APP.settings = data.settings || {};
    renderCustomers();
    renderInvoices();
    renderStats();
  } catch (error) {
    console.error('LOAD DATA ERROR:', error);
    toast(error.message || 'Gagal mengambil data.', true);
  }
}


function renderStats() {
  const paid = APP.invoices.filter(x => String(x.status).toLowerCase() === 'paid').length;
  const unpaid = APP.invoices.filter(x => ['unpaid', 'partially paid', 'sent'].includes(String(x.status).toLowerCase())).length;

  $('stats').innerHTML = `
    <div class="stat"><b>${APP.invoices.length}</b><span>TOTAL INVOICE</span></div>
    <div class="stat"><b>${paid}</b><span>PAID</span></div>
    <div class="stat"><b>${unpaid}</b><span>OUTSTANDING</span></div>
  `;
}


function renderCustomers() {
  $('customerSelect').innerHTML = '<option value="">-- Pilih Customer --</option>' +
    APP.customers.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.id)} - ${escapeHtml(c.name)}</option>`).join('');
}


function renderInvoices(list = APP.invoices) {
  $('emptyState').hidden = !!list.length;
  $('invoiceList').innerHTML = list.map(x => `
    <tr>
      <td><strong>${escapeHtml(x.invoiceNo)}</strong></td>
      <td>${escapeHtml(x.date)}</td>
      <td>${escapeHtml(x.customer)}</td>
      <td>${money(x.grandTotal)}</td>
      <td><span class="status ${statusClass(x.status)}">${escapeHtml(x.status)}</span></td>
      <td><button class="btn btn-light btn-small" onclick="previewInvoice('${encodeURIComponent(x.invoiceNo)}')">View</button></td>
    </tr>
  `).join('');
}


function filterInvoices() {
  const q = $('searchInput').value.toLowerCase().trim();
  renderInvoices(APP.invoices.filter(x =>
    String(x.invoiceNo || '').toLowerCase().includes(q) ||
    String(x.customer || '').toLowerCase().includes(q)
  ));
}


function openNewInvoice() {
  $('invoiceNo').value = '';
  $('customerSelect').value = '';
  $('customer').value = '';
  $('phone').value = '';
  $('email').value = '';
  $('address').value = '';
  $('notes').value = '';
  $('status').value = 'Draft';
  $('paymentMethod').value = 'Transfer Bank';
  $('taxPercent').value = APP.settings['Pajak Default (%)'] || 0;
  $('invoiceDate').value = todayLocal();
  $('itemsBody').innerHTML = '';
  addItem();
  openModal('formModal');
}


function selectCustomer() {
  const customer = APP.customers.find(x => x.id === $('customerSelect').value);
  if (!customer) return;
  $('customer').value = customer.name || '';
  $('phone').value = customer.phone || '';
  $('email').value = customer.email || '';
  $('address').value = customer.address || '';
}


function addItem(item = {}) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td class="item-no"></td>
    <td><input class="description" type="text" value="${escapeAttr(item.description || '')}"></td>
    <td><input class="qty" type="number" min="0" step="any" value="${item.qty ?? 1}"></td>
    <td><input class="price" type="number" min="0" step="any" value="${item.price ?? 0}"></td>
    <td class="item-total">Rp 0</td>
    <td><button type="button" class="delete-item">×</button></td>
  `;

  row.querySelectorAll('input').forEach(input => input.oninput = calculate);
  row.querySelector('.delete-item').onclick = () => {
    row.remove();
    renumber();
    calculate();
  };

  $('itemsBody').appendChild(row);
  renumber();
  calculate();
}


function renumber() {
  document.querySelectorAll('.item-no').forEach((el, i) => el.textContent = i + 1);
}


function getItems() {
  return [...document.querySelectorAll('#itemsBody tr')]
    .map(row => ({
      description: row.querySelector('.description').value.trim(),
      qty: Number(row.querySelector('.qty').value) || 0,
      price: Number(row.querySelector('.price').value) || 0
    }))
    .filter(x => x.description || x.qty || x.price);
}


function calculate() {
  let subtotal = 0;

  document.querySelectorAll('#itemsBody tr').forEach(row => {
    const qty = Number(row.querySelector('.qty').value) || 0;
    const price = Number(row.querySelector('.price').value) || 0;
    const total = qty * price;
    subtotal += total;
    row.querySelector('.item-total').textContent = money(total);
  });

  const taxPercent = Number($('taxPercent').value) || 0;
  const tax = subtotal * taxPercent / 100;
  const grandTotal = subtotal + tax;

  $('subtotal').textContent = money(subtotal);
  $('tax').textContent = money(tax);
  $('grandTotal').textContent = money(grandTotal);
}


async function saveInvoice() {
  const data = {
    invoiceNo: $('invoiceNo').value,
    date: $('invoiceDate').value,
    customerId: $('customerSelect').value,
    customer: $('customer').value.trim(),
    phone: $('phone').value.trim(),
    email: $('email').value.trim(),
    address: $('address').value.trim(),
    taxPercent: Number($('taxPercent').value) || 0,
    status: $('status').value,
    paymentMethod: $('paymentMethod').value,
    notes: $('notes').value.trim(),
    items: getItems()
  };

  if (!data.customer) return toast('Nama customer belum diisi.', true);
  if (!data.items.length) return toast('Minimal ada 1 item.', true);

  try {
    $('saveBtn').disabled = true;
    $('saveBtn').textContent = 'Menyimpan...';

    const result = await api('saveInvoice', { invoice: data });

    closeModal('formModal');
    toast(`Invoice ${result.invoiceNo} berhasil disimpan.`);
    await loadData();
    await previewInvoice(encodeURIComponent(result.invoiceNo));
  } catch (error) {
    console.error('SAVE INVOICE ERROR:', error);
    toast(error.message || 'Gagal menyimpan invoice.', true);
  } finally {
    $('saveBtn').disabled = false;
    $('saveBtn').textContent = 'Simpan Invoice';
  }
}


async function previewInvoice(encodedInvoiceNo) {
  try {
    const invoiceNo = decodeURIComponent(encodedInvoiceNo);
    const invoice = await api('getInvoice', { invoiceNo });
    $('printArea').innerHTML = buildInvoiceHTML(invoice);
    openModal('previewModal');
  } catch (error) {
    console.error('PREVIEW INVOICE ERROR:', error);
    toast(error.message || 'Gagal membuka invoice.', true);
  }
}


function buildInvoiceHTML(invoice) {
  const s = APP.settings;
  const company = s['Nama Perusahaan'] || 'SWA Pertanian';
  const address = s['Alamat Perusahaan'] || '';
  const phone = s['Telepon'] || '';
  const email = s['Email'] || '';
  const bank = s['Nama Bank'] || '';
  const account = s['No. Rekening'] || '';
  const accountName = s['Atas Nama'] || '';

  const rows = (invoice.items || []).map(item => `
    <tr>
      <td>${escapeHtml(item.no)}</td>
      <td>${escapeHtml(item.description)}</td>
      <td class="center">${escapeHtml(item.qty)}</td>
      <td class="right">${money(item.price)}</td>
      <td class="right">${money(item.total)}</td>
    </tr>
  `).join('');

  return `
    <div class="invoice">
      <div class="invoice-top">
        <div class="invoice-company">
          <div class="invoice-company-name">${escapeHtml(company)}</div>
          <div class="invoice-company-sub">${escapeHtml(address)}</div>
          ${phone || email ? `<div class="invoice-company-contact">${escapeHtml(phone)}${phone && email ? ' · ' : ''}${escapeHtml(email)}</div>` : ''}
        </div>
        <div class="invoice-heading">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-meta"><strong>${escapeHtml(invoice.invoiceNo)}</strong><br>${escapeHtml(invoice.date)}</div>
        </div>
      </div>

      <div class="invoice-accent"></div>

      <div class="invoice-info">
        <div>
          <div class="label-mini">BILL TO</div>
          <div class="customer-name">${escapeHtml(invoice.customer)}</div>
          ${invoice.phone ? `<div>${escapeHtml(invoice.phone)}</div>` : ''}
          ${invoice.email ? `<div>${escapeHtml(invoice.email)}</div>` : ''}
          ${invoice.address ? `<div>${escapeHtml(invoice.address)}</div>` : ''}
        </div>
        <div class="invoice-status-box">
          <span>STATUS</span>
          <strong>${escapeHtml(invoice.status || '')}</strong>
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr><th>NO</th><th>DESCRIPTION</th><th>QTY</th><th>PRICE</th><th>TOTAL</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="invoice-bottom">
        <div class="payment">
          <div class="label-mini">PAYMENT METHOD</div>
          <strong>${escapeHtml(invoice.paymentMethod || '')}</strong>
          ${bank || account || accountName ? `
            <div class="bank-box">
              ${bank ? `<div><span>Bank</span><strong>${escapeHtml(bank)}</strong></div>` : ''}
              ${account ? `<div><span>No. Rekening</span><strong>${escapeHtml(account)}</strong></div>` : ''}
              ${accountName ? `<div><span>Atas Nama</span><strong>${escapeHtml(accountName)}</strong></div>` : ''}
            </div>` : ''}
        </div>

        <div class="summary">
          <div class="summary-row"><span>Sub Total</span><strong>${money(invoice.subtotal)}</strong></div>
          <div class="summary-row"><span>Tax ${invoice.taxPercent}%</span><strong>${money(invoice.tax)}</strong></div>
          <div class="summary-grand"><span>GRAND TOTAL</span><strong>${money(invoice.grandTotal)}</strong></div>
        </div>
      </div>

      ${invoice.notes ? `<div class="invoice-notes"><div class="label-mini">CATATAN</div>${escapeHtml(invoice.notes)}</div>` : ''}

      <div class="invoice-footer">
        <strong>${escapeHtml(company)}</strong>
        <span>${escapeHtml(phone)}</span>
        <span>${escapeHtml(email)}</span>
      </div>
    </div>
  `;
}


function openModal(id) {
  const modal = $(id);
  if (!modal) return;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const modal = $(id);
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

function money(value) {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
}

function statusClass(status) {
  return String(status || 'draft').toLowerCase().replace(/\s+/g, '-');
}

function toast(message, isError = false) {
  const element = $('toast');
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('error', isError);
  element.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => element.classList.remove('show'), 2800);
}

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[c]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

window.previewInvoice = previewInvoice;
window.saveInvoice = saveInvoice;
