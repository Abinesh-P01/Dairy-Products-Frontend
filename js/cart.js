/* ============================================
   SHOPPING CART LOGIC (localStorage)
   ============================================ */

const CART_KEY = 'dairy_cart';

/* ============================================
   GET CART FROM localStorage
   ============================================ */
function getCart() {
    try {
        const cart = localStorage.getItem(CART_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch {
        return [];
    }
}

/* ============================================
   SAVE CART TO localStorage
   ============================================ */
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

/* ============================================
   ADD TO CART HELPER
   ============================================ */
function addToCartHelper(product, qty = 1) {
    const cart = getCart();
    const id = getProductId(product);
    const name = getProductName(product);
    const price = getProductPrice(product);
    const stock = getProductStock(product);
    const image = getProductImage(product);

    const existing = cart.find(item => item.id === id);

    if (existing) {
        if (existing.quantity + qty > stock) {
            showToast(`Only ${stock} items available in stock`, 'warning');
            return;
        }
        existing.quantity += qty;
    } else {
        if (qty > stock) {
            showToast(`Only ${stock} items available in stock`, 'warning');
            return;
        }
        cart.push({
            id,
            name,
            price,
            stock,
            image,
            quantity: qty
        });
    }

    saveCart(cart);
    showToast(`${name} added to cart`);
}

/* ============================================
   REMOVE FROM CART
   ============================================ */
function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    displayCart();
}

/* ============================================
   UPDATE CART QUANTITY
   ============================================ */
function updateCartQuantity(id, delta) {
    const cart = getCart();
    const item = cart.find(item => item.id === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
        removeFromCart(id);
        return;
    }
    if (newQty > item.stock) {
        showToast(`Only ${item.stock} items available`, 'warning');
        return;
    }

    item.quantity = newQty;
    saveCart(cart);
    displayCart();
}

/* ============================================
   CALCULATE CART TOTAL
   ============================================ */
function calculateCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

/* ============================================
   DISPLAY CART
   ============================================ */
function displayCart() {
    const cartContainer = document.getElementById('cart-items');
    const summaryContainer = document.getElementById('cart-summary-content');

    if (!cartContainer) return;

    const cart = getCart();

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Start shopping to add items to your cart.</p>
                <a href="products.html" class="btn btn-primary mt-2">Browse Products</a>
            </div>
        `;
        if (summaryContainer) {
            summaryContainer.innerHTML = '';
        }
        return;
    }

    cartContainer.innerHTML = cart.map(item => {
        const imageHtml = item.image
            ? `<img src="${item.image}" alt="${item.name}" onerror="this.parentElement.innerHTML='&#129472;'">`
            : '&#129472;';

        return `
            <div class="cart-item">
                <div class="item-image">${imageHtml}</div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${formatCurrency(item.price)}</div>
                </div>
                <div class="item-qty">
                    <button onclick="updateCartQuantity(${item.id}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity(${item.id}, 1)">+</button>
                </div>
                <div class="item-subtotal">${formatCurrency(item.price * item.quantity)}</div>
                <button class="item-remove" onclick="removeFromCart(${item.id})" title="Remove">&#10005;</button>
            </div>
        `;
    }).join('');

    const subtotal = calculateCartTotal();
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <h3>Order Summary</h3>
            <div class="summary-row">
                <span>Subtotal (${cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
            </div>
            ${shipping > 0 ? '<div class="summary-row" style="font-size:0.8rem;color:var(--text-light);"><span>Free shipping on orders above ₹500</span></div>' : ''}
            <div class="summary-total">
                <span>Total</span>
                <span>${formatCurrency(total)}</span>
            </div>
            <a href="checkout.html" class="btn btn-primary" style="width:100%;">Proceed to Checkout</a>
        `;
    }
}

/* ============================================
   INIT CART PAGE
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const cartPage = document.getElementById('cart-items');
    if (cartPage) {
        displayCart();
    }
});
