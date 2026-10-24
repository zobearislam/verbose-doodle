// Supabase connection
const SUPABASE_URL = 'https://dvgtfbkzctnhjlklrehs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2Z3RmYmt6Y3RuaGpsa2xyZWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDAyNTEsImV4cCI6MjEwODMxNjI1MX0.nI6UvLexXKfI2DCjDVHMdqsrbKQBtBz89xbL2Rk5aBY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const ordersList = document.getElementById('orders-list');
const signoutBtn = document.getElementById('signout-btn');

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showDashboard();
    loadOrders();
  } else {
    showAuth();
  }
}

function showAuth() {
  authSection.style.display = 'block';
  dashboard.style.display = 'none';
}

function showDashboard() {
  authSection.style.display = 'none';
  dashboard.style.display = 'block';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const email = formData.get('email');
  const password = formData.get('password');

  authMessage.textContent = 'Signing in...';
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authMessage.textContent = 'Sign in failed: ' + error.message;
    authMessage.style.color = '#c2334f';
    return;
  }

  authMessage.textContent = '';
  showDashboard();
  loadOrders();
});

signoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  showAuth();
  ordersList.innerHTML = '';
});

async function loadOrders() {
  ordersList.innerHTML = '<p class="placeholder">Loading orders...</p>';

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    ordersList.innerHTML = '<p class="placeholder">Could not load orders. Check RLS policies and sign-in.</p>';
    console.error(error);
    return;
  }

  if (!orders || orders.length === 0) {
    ordersList.innerHTML = '<p class="placeholder">No orders yet.</p>';
    return;
  }

  ordersList.innerHTML = orders.map(order => {
    const itemsStr = Array.isArray(order.items) ? order.items.map(i => `${i.quantity}x ${i.name || i.product_id} @ ${i.unit_price}`).join(', ') : '';
    return `
      <div class="order-item">
        <p><strong>ID:</strong> ${order.id}</p>
        <p><strong>Name:</strong> ${order.customer_name || order.name || 'N/A'}</p>
        <p><strong>Phone:</strong> ${order.customer_phone || order.phone || 'N/A'}</p>
        <p><strong>Address:</strong> ${order.customer_address || 'N/A'}</p>
        <p><strong>Note:</strong> ${order.delivery_note || ''}</p>
        <p><strong>Items:</strong> ${itemsStr}</p>
        <p><strong>Subtotal:</strong> ${order.subtotal || 0}</p>
        <p><strong>Payment:</strong> ${order.payment_method || 'Cash on delivery'}</p>
        <p><strong>Status:</strong> ${order.status || 'pending'}</p>
        <p><strong>Created:</strong> ${order.created_at ? new Date(order.created_at).toLocaleString() : ''}</p>
        <select class="status-select" data-id="${order.id}">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
        <button class="update-status btn secondary" data-id="${order.id}">Update Status</button>
      </div>
    `;
  }).join('');

  // Attach update listeners
  document.querySelectorAll('.update-status').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const select = document.querySelector(`.status-select[data-id="${id}"]`);
      const newStatus = select.value;
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        alert('Update failed: ' + error.message);
        return;
      }
      alert('Status updated!');
      loadOrders();
    });
  });
}

// Init
checkSession();
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    showDashboard();
    loadOrders();
  } else {
    showAuth();
  }
});
