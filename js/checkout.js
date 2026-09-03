/* ============================================
   CHECKOUT PAGE LOGIC
   ============================================ */

/* ============================================
   DISPLAY ORDER SUMMARY ON CHECKOUT
   ============================================ */
function displayCheckoutSummary() {
    const summaryEl = document.getElementById('checkout-summary-items');
    const totalEl = document.getElementById('checkout-total');

    if (!summaryEl) return;

    const cart = getCart();

    if (cart.length === 0) {
        summaryEl.innerHTML = '<p>No items in cart.</p>';
        if (totalEl) totalEl.textContent = formatCurrency(0);
        return;
    }

    summaryEl.innerHTML = cart.map(item => `
        <div class="order-item">
            <div>
                <span>${item.name}</span>
                <span class="item-qty"> x${item.quantity}</span>
            </div>
            <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
    `).join('');

    const subtotal = calculateCartTotal();
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    if (totalEl) totalEl.textContent = formatCurrency(total);
}

/* ============================================
   VALIDATE CHECKOUT FORM
   ============================================ */
function validateCheckoutForm() {
    let isValid = true;
    const fields = [
        { id: 'customer-name', name: 'Customer Name' },
        { id: 'customer-mobile', name: 'Mobile Number' },
        { id: 'customer-email', name: 'Email' },
        { id: 'customer-address', name: 'Delivery Address' },
        { id: 'customer-city', name: 'City' },
        { id: 'customer-pincode', name: 'Pincode' },
        { id: 'payment-method', name: 'Payment Method' }
    ];

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const formGroup = input ? input.closest('.form-group') : null;
        if (!input || !formGroup) return;

        formGroup.classList.remove('error');
        if (!input.value.trim()) {
            formGroup.classList.add('error');
            const errorText = formGroup.querySelector('.error-text');
            if (errorText) errorText.textContent = `${field.name} is required`;
            isValid = false;
        }
    });

    // Validate email format
    const email = document.getElementById('customer-email');
    if (email && email.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim())) {
            email.closest('.form-group').classList.add('error');
            const errorText = email.closest('.form-group').querySelector('.error-text');
            if (errorText) errorText.textContent = 'Please enter a valid email';
            isValid = false;
        }
    }

    // Validate mobile (10 digits)
    const mobile = document.getElementById('customer-mobile');
    if (mobile && mobile.value.trim()) {
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile.value.trim())) {
            mobile.closest('.form-group').classList.add('error');
            const errorText = mobile.closest('.form-group').querySelector('.error-text');
            if (errorText) errorText.textContent = 'Please enter a valid 10-digit mobile number';
            isValid = false;
        }
    }

    // Validate pincode (6 digits)
    const pincode = document.getElementById('customer-pincode');
    if (pincode && pincode.value.trim()) {
        const pincodeRegex = /^\d{6}$/;
        if (!pincodeRegex.test(pincode.value.trim())) {
            pincode.closest('.form-group').classList.add('error');
            const errorText = pincode.closest('.form-group').querySelector('.error-text');
            if (errorText) errorText.textContent = 'Please enter a valid 6-digit pincode';
            isValid = false;
        }
    }

    return isValid;
}

/* ============================================
   PLACE ORDER
   ============================================ */
async function placeOrder() {
    if (!validateCheckoutForm()) {
        showToast('Please fill in all required fields correctly', 'error');
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    const customer_name = document.getElementById('customer-name').value.trim();
    const phone = parseInt(document.getElementById('customer-mobile').value.trim()) || 0;
    const email = document.getElementById('customer-email').value.trim();
    const username = (typeof getLoggedInUsername === 'function') ? getLoggedInUsername() : '';

    const addressParts = [
        document.getElementById('customer-address').value.trim(),
        document.getElementById('customer-city').value.trim(),
        document.getElementById('customer-pincode').value.trim()
    ].filter(Boolean).join(', ');

    /*
     * Backend createOrders() expects an order with product_id & quantity.
     * It decreases the product stock, computes total_price, and links the
     * order to the logged-in username so the user can view/cancel it later.
     */
    const btn = document.querySelector('.checkout-form .btn-primary');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Placing Order...';
    }

    try {
        for (const item of cart) {
            const orderData = {
                customer_name: customer_name,
                phone: phone,
                email: email,
                address: addressParts,
                product_id: item.id,
                quantity: item.quantity,
                total_price: 0,
                username: username
            };
            await apiCall('/createorders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
        }

        showToast('Order placed successfully!');

        /*
         * Clear the cart
         */
        localStorage.removeItem(CART_KEY);
        updateCartBadge();

        /*
         * Redirect to order confirmation page
         */
        window.location.href = 'checkout.html?confirmed=true';
    } catch (error) {
        showToast(error.message || 'Failed to place order. Please try again.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Place Order';
        }
    }
}

/* ============================================
   CHECK FOR ORDER CONFIRMATION
   ============================================ */
function checkOrderConfirmation() {
    const params = new URLSearchParams(window.location.search);
    const confirmed = params.get('confirmed');
    const orderId = params.get('order_id');

    if (confirmed === 'true') {
        const formEl = document.querySelector('.checkout-layout');
        if (formEl) {
            formEl.innerHTML = `
                <div class="order-confirmation" style="grid-column: 1 / -1;">
                    <div class="confirm-icon">&#10004;</div>
                    <h1>Order Placed Successfully!</h1>
                    <p>Thank you for shopping with us.</p>
                    ${orderId ? `<p class="order-id">Order ID: #${orderId}</p>` : ''}
                    <p>We will deliver your order soon.</p>
                    <a href="products.html" class="btn btn-primary mt-3">Continue Shopping</a>
                </div>
            `;
        }
    }
}

/* ============================================
   INIT CHECKOUT PAGE
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    checkOrderConfirmation();
    displayCheckoutSummary();
});
