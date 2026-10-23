// Basic frontend structure
// Supabase connection will be added later

const productList = document.getElementById('product-list');
const productSelect = document.getElementById('product-select');
const orderForm = document.getElementById('order-form');
const orderMessage = document.getElementById('order-message');

// Placeholder: later this will fetch from Supabase
function loadProducts() {
  // TODO: replace with Supabase query
  // Example structure we expect from Supabase:
  // { id, name, price, description, image_url }
  productList.innerHTML = '<p class="placeholder">Waiting for Supabase product data...</p>';
}

// Placeholder: later this will insert into Supabase orders table
orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(orderForm);
  const order = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    product: formData.get('product')
  };

  // TODO: insert into Supabase orders table
  console.log('Order data ready for Supabase:', order);
  orderMessage.textContent = 'Order received locally. Will be saved to Supabase once connected.';
  orderForm.reset();
});

// Run on load
loadProducts();
