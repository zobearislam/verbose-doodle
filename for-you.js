// Supabase connection
const SUPABASE_URL = 'https://dvgtfbkzctnhjlklrehs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2Z3RmYmt6Y3RuaGpsa2xyZWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDAyNTEsImV4cCI6MjEwODMxNjI1MX0.nI6UvLexXKfI2DCjDVHMdqsrbKQBtBz89xbL2Rk5aBY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const forYouList = document.getElementById('for-you-list');

async function loadForYou() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    forYouList.innerHTML = '<p class="placeholder">Could not load toys.</p>';
    console.error(error);
    return;
  }

  if (!products || products.length === 0) {
    forYouList.innerHTML = '<p class="placeholder">No toys yet. Add some in Supabase!</p>';
    return;
  }

  forYouList.innerHTML = products.map(product => `
    <div class="product-card">
      ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}">` : ''}
      <h3>${product.name}</h3>
      <p><strong>Price:</strong> ${product.price}</p>
      <p>${product.description || ''}</p>
      <a href="shop.html" class="btn" style="display:inline-block; margin-top:10px;">Order this</a>
    </div>
  `).join('');
}

loadForYou();
