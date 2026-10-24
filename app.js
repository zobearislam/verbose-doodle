// Supabase connection (anon key is public; RLS must protect data)
const SUPABASE_URL = 'https://dvgtfbkzctnhjlklrehs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2Z3RmYmt6Y3RuaGpsa2xyZWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDAyNTEsImV4cCI6MjEwODMxNjI1MX0.nI6UvLexXKfI2DCjDVHMdqsrbKQBtBz89xbL2Rk5aBY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const productList = document.getElementById('product-list');
const productSelect = document.getElementById('product-select');
const orderForm = document.getElementById('order-form');
const orderMessage = document.getElementById('order-message');
const submitBtn = document.getElementById('submit-btn');

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

function renderProductCard(product) {
  const images = getProductImages(product);
  const mainImg = images[0] || '';
  const extraImgs = images.slice(1);
  const imgHtml = images.length > 0
    ? `<div class="image-gallery">${images.map((src, i) => `<img src="${src}" alt="${product.name || 'Toy'} view ${i+1}" class="${i===0 ? 'main-image' : 'extra-image'}" onerror="this.style.display='none'">`).join('')}</div>`
    : '<p class="placeholder">No image</p>';
  return `
    <div class="product-card" data-id="${product.id}">
      ${imgHtml}
      <h3>${product.name || 'Unnamed Toy'}</h3>
      <p><strong>Price:</strong> ${product.price != null ? product.price : 'N/A'}</p>
      <p>${product.description || ''}</p>
    </div>
  `;
}

async function loadProducts() {
  productList.innerHTML = '<p class="placeholder">Loading toys...</p>';
  productSelect.innerHTML = '<option value="">Pick a toy</option>';

  let products = [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Products load error:', error);
      productList.innerHTML = '<p class="placeholder">Could not load toys. Check connection or add products in Supabase.</p>';
      return;
    }

    products = data || [];
  } catch (e) {
    console.error(e);
    productList.innerHTML = '<p class="placeholder">Could not load toys.</p>';
    return;
  }

  if (products.length === 0) {
    productList.innerHTML = '<p class="placeholder">No toys yet. Add some in the Supabase dashboard (products table).</p>';
    return;
  }

  productList.innerHTML = products.map(renderProductCard).join('');

  products.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name || `Product ${product.id}`;
    option.dataset.price = product.price || 0;
    productSelect.appendChild(option);
  });
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
    return;
  }

  isSubmitting = true;
  submitBtn.disabled = true;
  orderMessage.textContent = 'Sending order...';
  orderMessage.style.color = '#4aa3d8';

  // Get selected product price for line total
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

  const { data, error } = await supabase
    .from('orders')
    .insert([order])
    .select();

  isSubmitting = false;
  submitBtn.disabled = false;

  if (error) {
    console.error('Order insert error:', error);
    orderMessage.textContent = 'Failed to save order. Please try again. (Order not confirmed)';
    orderMessage.style.color = '#c2334f';
    return;
  }

  orderMessage.textContent = 'Order saved! We will contact you to confirm. Order is pending until confirmed.';
  orderMessage.style.color = '#58cc02';
  orderForm.reset();
  // Reset quantity to 1
  orderForm.querySelector('[name="quantity"]').value = 1;
});

// Load products when page starts
loadProducts();
