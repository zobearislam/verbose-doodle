// Supabase connection
const SUPABASE_URL = 'https://dvgtfbkzctnhjlklrehs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2Z3RmYmt6Y3RuaGpsa2xyZWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDAyNTEsImV4cCI6MjEwODMxNjI1MX0.nI6UvLexXKfI2DCjDVHMdqsrbKQBtBz89xbL2Rk5aBY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const productList = document.getElementById('product-list');
const productSelect = document.getElementById('product-select');
const orderForm = document.getElementById('order-form');
const orderMessage = document.getElementById('order-message');

async function loadProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    productList.innerHTML = '<p class="placeholder">Could not load toys.</p>';
    console.error(error);
    return;
  }

  if (!products || products.length === 0) {
    productList.innerHTML = '<p class="placeholder">No toys yet. Add some in the Supabase dashboard.</p>';
    return;
  }

  // Clear select options except the first one
  productSelect.innerHTML = '<option value="">Select a toy</option>';

  productList.innerHTML = products.map(product => `
    <div class="product-card">
      ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}">` : ''}
      <h3>${product.name}</h3>
      <p><strong>Price:</strong> ${product.price}</p>
      <p>${product.description || ''}</p>
    </div>
  `).join('');

  products.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    productSelect.appendChild(option);
  });
}

orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  orderMessage.textContent = 'Sending order...';

  const formData = new FormData(orderForm);
  const order = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    product_id: formData.get('product')
  };

  const { error } = await supabase
    .from('orders')
    .insert([order]);

  if (error) {
    orderMessage.textContent = 'Failed to save order. Try again.';
    console.error(error);
    return;
  }

  orderMessage.textContent = 'Order saved!';
  orderForm.reset();
});

// Load products when page starts
loadProducts();
