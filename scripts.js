<!-- scripts.js -->

// Load Header and Footer dynamically
function loadHeaderFooter() {
  fetch('header.html').then(res => res.text()).then(data => document.body.insertAdjacentHTML('afterbegin', data));
  fetch('footer.html').then(res => res.text()).then(data => document.body.insertAdjacentHTML('beforeend', data));
}
document.addEventListener('DOMContentLoaded', loadHeaderFooter);

// Products Data (Sample)
const products = [
  {id: '1', name: 'Alice Smith', category: 'managers', ean: '123456789', sku: 'MAN-001'},
  {id: '2', name: 'Bob Jones', category: 'lead', ean: '987654321', sku: 'LEA-002'},
  {id: '3', name: 'Charlie Brown', category: 'consultant', ean: '192837465', sku: 'CON-003'},
  {id: '4', name: 'Diana Prince', category: 'interns', ean: '564738291', sku: 'INT-004'}
];

// Load Category
function loadCategory() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  document.getElementById('category-title').textContent = type.charAt(0).toUpperCase() + type.slice(1);
  const container = document.getElementById('category-products');
  products.filter(p => p.category === type).forEach(p => {
    container.innerHTML += `<div class="product-card">
      <img src="assets/consultant-placeholder.jpg" alt="${p.name}">
      <h3>${p.name}</h3>
      <button onclick="window.location='product.html?id=${p.id}'">View Profile</button>
    </div>`;
  });
}

// Load Product Detail
function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const product = products.find(p => p.id === params.get('id'));
  document.getElementById('product-detail').innerHTML = `
    <h2>${product.name}</h2>
    <img src="assets/consultant-placeholder.jpg" alt="${product.name}">
    <p>EAN: ${product.ean}</p>
    <p>SKU: ${product.sku}</p>
    <button onclick="addToCart('${product.ean}')">Add to Cart</button>
  `;
}

// Cart Management
function addToCart(ean) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const item = cart.find(i => i.ean === ean);
  if (item) item.quantity++;
  else cart.push({ean, quantity: 1});
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Added to cart!');
}

// Checkout Initialization
function checkoutInit() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const container = document.getElementById('cart-summary');
  cart.forEach(item => {
    const product = products.find(p => p.ean === item.ean);
    container.innerHTML += `<p>${product.name} (EAN: ${product.ean}) - Quantity: ${item.quantity}</p>`;
  });

  document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    localStorage.setItem('orderTotal', document.getElementById('shipping').value);
    window.location = 'confirmation.html';
  });
}

// Load Confirmation
function loadConfirmation() {
  const orderNumber = Math.floor(1000 + Math.random() * 9000);
  document.getElementById('order-number').textContent = orderNumber;
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = localStorage.getItem('orderTotal');
  const container = document.getElementById('confirmation-summary');
  cart.forEach(item => {
    const product = products.find(p => p.ean === item.ean);
    container.innerHTML += `<p>${product.name} - Quantity: ${item.quantity}</p>`;
  });
  container.innerHTML += `<strong>Total Cost: €${total}</strong>`;
  localStorage.removeItem('cart');
}

// Account Creation
function accountInit() {
  document.getElementById('account-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Account created!');
    window.location = 'index.html';
  });
}