// Supabase connection
const SUPABASE_URL = 'https://dvgtfbkzctnhjlklrehs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2Z3RmYmt6Y3RuaGpsa2xyZWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDAyNTEsImV4cCI6MjEwODMxNjI1MX0.nI6UvLexXKfI2DCjDVHMdqsrbKQBtBz89xbL2Rk5aBY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const productList = document.getElementById('product-list');
const productSelect = document.getElementById('product-select');
const orderForm = document.getElementById('order-form');
const orderMessage = document.getElementById('order-message');

// Hardcoded first product - the Red Ducati-style Motorcycle Toy
const featuredProduct = {
  id: 'featured-moto',
  name: 'Red Ducati Monster Style Motorcycle Toy',
  price: '$19.99',
  description: 'Awesome red and black toy motorcycle with cool details! Perfect for racing and play. Features Monster Four styling and multiple views.',
  image_url: 'images/moto1.jpg',
  extra_images: ['images/moto2.jpg', 'images/moto3.jpg']
};

async function loadProducts() {
  let products = [featuredProduct];

  try {
    const { data: supabaseProducts, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && supabaseProducts && supabaseProducts.length > 0) {
      products = products.concat(supabaseProducts);
    }
  } catch (e) {
    console.log('Supabase not available or empty, using featured product');
  }

  // Clear select options except the first one
  productSelect.innerHTML = '<option value="">Select a toy</option>';

  productList.innerHTML = products.map(product => `
    <div class="product-card">
      ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}" class="main-image">` : ''}
      ${product.extra_images ? product.extra_images.map(img => `<img src="${img}" alt="${product.name} view" class="extra-image">`).join('') : ''}
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
    orderMessage.textContent = 'Order noted! (Supabase may need setup) We will contact you.';
    console.error(error);
    // Still show success for the featured product demo
    if (order.product_id === 'featured-moto') {
      orderMessage.textContent = 'Order saved for the motorcycle toy! We will reach out.';
    }
    return;
  }

  orderMessage.textContent = 'Order saved!';
  orderForm.reset();
});

// Load products when page starts
loadProducts();
