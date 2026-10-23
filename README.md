# Toy Order Site (verbose-doodle)

Simple structure for a public toy ordering site.

## Current status
- GitHub Pages ready structure
- Product display area
- Order form (name + phone number)
- Bland styling (intentionally minimal)

## Next step: Supabase
Once Supabase is connected we will:
1. Create tables:
   - `products` (id, name, price, description, image_url)
   - `orders` (id, name, phone, product_id, created_at)
2. Load products from Supabase into the page
3. Save orders to Supabase
4. Add a simple admin view (or use Supabase dashboard) to see all orders with phone numbers

## Files
- `index.html` — page structure
- `style.css` — minimal styles
- `app.js` — frontend logic (Supabase placeholders)

Host this on GitHub Pages when ready.
