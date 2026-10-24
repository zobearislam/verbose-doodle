// Supabase connection
const SUPABASE_URL = 'https://dvgtfbkzctnhjlklrehs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2Z3RmYmt6Y3RuaGpsa2xyZWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDAyNTEsImV4cCI6MjEwODMxNjI1MX0.nI6UvLexXKfI2DCjDVHMdqsrbKQBtBz89xbL2Rk5aBY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const forYouList = document.getElementById('for-you-list');

function getProductImages(product) {
  const urls = [];
  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    product.image_urls.forEach(u => { if (u && typeof u === 'string' && u.trim()) urls.push(u.trim()); });
  }
  if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim() && !urls.includes(product.image_url.trim())) {
    urls.push(product.image_url.trim());
  }
  return urls;
}

async function loadForYou() {
  forYouList.innerHTML = '<p class="placeholder">Loading special toys...</p>';

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

  forYouList.innerHTML = products.map(product => {
    const images = getProductImages(product);
    const img = images[0] ? `<img src="${images[0]}" alt="${product.name}" onerror="this.style.display='none'">` : '';
    return `
      <div class="product-card">
        ${img}
        <h3>${product.name || 'Toy'}</h3>
        <p><strong>Price:</strong> ${product.price || 'N/A'}</p>
        <p>${product.description || ''}</p>
        <a href="shop.html" class="btn" style="display:inline-block; margin-top:10px;">Order this</a>
      </div>
    `;
  }).join('');
}

loadForYou();
