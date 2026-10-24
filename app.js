// Supabase connection (anon key is public; RLS protects data)
const SUPABASE_URL = 'https://dvgtfbkzctnhjlklrehs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2Z3RmYmt6Y3RuaGpsa2xyZWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDAyNTEsImV4cCI6MjEwODMxNjI1MX0.nI6UvLexXKfI2DCjDVHMdqsrbKQBtBz89xbL2Rk5aBY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const productList = document.getElementById('product-list');
const productSelect = document.getElementById('product-select');
const orderForm = document.getElementById('order-form');
const orderMessage = document.getElementById('order-message');
const submitBtn = document.getElementById('submit-btn');
const filtersContainer = document.getElementById('category-filters');

let allProducts = [];
let isSubmitting = false;

function getProductImages(product) {
  const urls = [];
  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    product.image_urls.forEach(u => {
      if (u && typeof u === 'string' && u.trim() && !urls.includes(u.trim())) {
        urls.push(u.trim());
      }
    });
  }
  if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim() && !urls.includes(product.image_url.trim())) {
    urls.push(product.image_url.trim());
  }
  return urls.filter(u => u.startsWith('http') || u.startsWith('images/') || u.startsWith('./') || u.startsWith('/'));
}

function stockLabel(stock) {
  if (stock == null) return '';
  if (stock <= 0) return '<span class="stock out">Out of stock</span>';
  if (stock <= 3) return `<span class="stock low">Only ${stock} left</span>`;
  return `<span class="stock">${stock} in stock</span>`;
}

function renderProductCard(product) {
  const images = getProductImages(product);
  const mainImg = images[0] || '';
  const imgHtml = mainImg
    ? `<div class="img-wrap"><img src="${mainImg}" alt="${product.name || 'Toy'}" onerror="this.parentElement.style.background='#f0f4f8'"></div>`
    : '<div class="img-wrap"><span style="font-size:2rem">\ud83e\uddf8</span></div>';

  const age = (product.age_min != null || product.age_max != null)
    ? `<div class="meta">Ages ${product.age_min ?? '?' }–${product.age_max ?? '?'}</div>`
    : '';

  const price = product.price != null ? product.price : 'N/A';
  const currency = product.currency || 'BDT';

  return `
    <div class="product-card" data-id="${product.id}" data-category="${product.category_id || ''}">
      ${imgHtml}
      <h3>${product.name || 'Unnamed Toy'}</h3>
      <div class="price-badge">${currency} ${price}</div>
      ${age}
      <p>${product.description || ''}</p>
      ${stockLabel(product.stock)}
    </div>
  `;
}

function renderFilters(products) {
  if (!filtersContainer) return;
  const cats = new Map();
  products.forEach(p => {
    if (p.categories && p.categories.name) {
      cats.set(p.category_id, p.categories.name);
    }
  });
  if (cats.size === 0) {
    filtersContainer.style.display = 'none';
    return;
  }
  filtersContainer.innerHTML = '<button class="filter-btn active" data-cat="all">All Toys</button>' +
    Array.from(cats.entries()).map(([id, name]) =>
      `<button class="filter-btn" data-cat="${id}">${name}</button>`
    ).join('');

  filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.category_id === cat);
      productList.innerHTML = filtered.map(renderProductCard).join('') || '<p class="placeholder">No toys in this category.</p>';
    });
  });
}

async function loadProducts() {
  productList.innerHTML = '<p class="placeholder">Loading toys...</p>';
  productSelect.innerHTML = '<option value="">Pick a toy</option>';

  try {
    // Try to join categories if the new schema exists
    let query = supabase.from('products').select('*, categories(name, slug)').order('created_at', { ascending: false });
    let { data, error } = await query;

    // Fallback if join fails (old schema)
    if (error) {
      const fallback = await supabase.from('products').select('*').order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error(error);
      productList.innerHTML = '<p class="placeholder">Could not load toys. Please try again later.</p>';
      return;
    }

    allProducts = (data || []).filter(p => p.is_active !== false);
    productList.innerHTML = allProducts.map(renderProductCard).join('') || '<p class="placeholder">No toys available right now.</p>';

    allProducts.forEach(product => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = product.name || `Product ${product.id}`;
      option.dataset.price = product.price || 0;
      productSelect.appendChild(option);
    });

    renderFilters(allProducts);
  } catch (err) {
    console.error(err);
    productList.innerHTML = '<p class="placeholder">Something went wrong loading toys.</p>';
  }
}

orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  const formData = new FormData(orderForm);
  const name = formData.get('customer_name')?.trim();
  const phone = formData.get('customer_phone')?.trim();
  const address = formData.get('customer_address')?.trim();
  const note = formData.get('delivery_note')?.trim() || '';
  const productId = formData.get('product');
  const qty = parseInt(formData.get('quantity'), 10) || 1;

  if (!name || !phone || !address || !productId || qty < 1) {
    orderMessage.textContent = 'Please fill name, phone, address, select a toy, and quantity.';
    orderMessage.style.color = '#c2334f';
    orderMessage.style.background = '#fff5f5';
    return;
  }

  isSubmitting = true;
  submitBtn.disabled = true;
  orderMessage.textContent = 'Sending order...';
  orderMessage.style.color = '#4aa3d8';
  orderMessage.style.background = '#f0f8ff';

  const selectedOption = productSelect.selectedOptions[0];
  const unitPrice = parseFloat(selectedOption?.dataset.price) || 0;
  const lineTotal = unitPrice * qty;
  const items = [{
    product_id: productId,
    name: selectedOption?.textContent || '',
    quantity: qty,
    unit_price: unitPrice,
    line_total: lineTotal
  }];

  const order = {
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    delivery_note: note,
    items: items,
    subtotal: lineTotal,
    payment_method: 'Cash on delivery',
    status: 'pending'
  };

  const { data, error } = await supabase.from('orders').insert([order]).select();

  isSubmitting = false;
  submitBtn.disabled = false;

  if (error) {
    console.error('Order insert error:', error);
    orderMessage.textContent = 'Failed to save order. Please try again.';
    orderMessage.style.color = '#c2334f';
    orderMessage.style.background = '#fff5f5';
    return;
  }

  orderMessage.textContent = 'Order saved! We will contact you to confirm. Order is pending until confirmed.';
  orderMessage.style.color = '#58cc02';
  orderMessage.style.background = '#f0fff4';
  orderForm.reset();
  orderForm.querySelector('[name="quantity"]').value = 1;
});

loadProducts();
