/* ============================================
   MY ORDERS PAGE LOGIC
   Shows the logged-in user's orders and lets
   them cancel an order (restocks the product).
   Backend:
     GET  /orders/{username}
     POST /orders/cancel/{orderId}?username=X
   ============================================ */

async function fetchMyOrders() {
    const content = document.getElementById('my-orders-content');
    const username = getLoggedInUsername();

    if (!username) {
        content.innerHTML = emptyState('Please login to view your orders.', 'login.html', 'Go to Login');
        return;
    }

    try {
        const data = await apiCall(`/orders/${encodeURIComponent(username)}`);
        const orders = Array.isArray(data) ? data : (data.orders || data.data || []);
        displayMyOrders(orders);
    } catch (error) {
        content.innerHTML = emptyState('Failed to load your orders.', null, null);
        showToast(error.message, 'error');
    }
}

function displayMyOrders(orders) {
    const content = document.getElementById('my-orders-content');

    if (!orders || orders.length === 0) {
        content.innerHTML = emptyState('You have no orders yet.', 'products.html', 'Start Shopping');
        return;
    }

    content.innerHTML = `
        <div class="orders-list" style="display:flex;flex-direction:column;gap:1rem;">
            ${orders.map(order => {
                const orderId = order.orderid || order.id || 'N/A';
                const total = order.total_price || 0;
                const status = (order.order_status || 'PLACED').toUpperCase();
                const statusColor = status === 'CANCELLED' ? '#d32f2f' : '#2e7d32';
                const cancelled = status === 'CANCELLED';

                return `
                    <div class="cart-item" style="flex-wrap:wrap;">
                        <div style="flex:1;min-width:180px;">
                            <div class="item-name">Order #${orderId}</div>
                            <div style="font-size:0.85rem;color:var(--text-light);">
                                Product #${order.product_id || ''} &middot; Qty: ${order.quantity || ''}
                            </div>
                            <div style="font-size:0.8rem;color:var(--text-light);">${order.address || ''}</div>
                        </div>
                        <div style="text-align:right;">
                            <div class="item-price">${formatCurrency(total)}</div>
                            <div style="font-size:0.85rem;color:${statusColor};font-weight:600;">${status}</div>
                        </div>
                        <div>
                            ${cancelled
                                ? `<span class="btn btn-secondary btn-sm" disabled>Cancelled</span>`
                                : `<button type="button" class="btn btn-danger btn-sm" onclick="cancelOrder(${orderId}, this)">Cancel Order</button>`}
                        </div>
                        <div style="flex-basis:100%;">
                            ${renderStatusTimeline(status)}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/*
 * Renders a horizontal tracking timeline showing the 4 fulfillment
 * stages. Completed stages turn green, the current stage is highlighted,
 * and a cancelled order shows a distinct cancelled state.
 */
function renderStatusTimeline(status) {
    const stages = [
        { key: 'PLACED', label: 'Placed', icon: '&#128203;' },
        { key: 'PROCESSING', label: 'Processing', icon: '&#128295;' },
        { key: 'SHIPPED', label: 'Shipped', icon: '&#128666;' },
        { key: 'DELIVERED', label: 'Delivered', icon: '&#128230;' }
    ];

    if (status === 'CANCELLED') {
        return `
            <div class="tracking-cancelled" style="text-align:center;padding:0.75rem;margin-top:0.5rem;border-radius:8px;background:#fdecea;color:#d32f2f;font-weight:600;">
                This order was cancelled
            </div>
        `;
    }

    const currentIndex = stages.findIndex(s => s.key === status);
    const effIndex = currentIndex < 0 ? 0 : currentIndex;

    const timeline = stages.map((stage, i) => {
        const isDone = i <= effIndex;
        const isCurrent = i === effIndex;
        const color = isDone ? '#2e7d32' : 'var(--text-light)';
        const dotColor = isCurrent ? '#f57c00' : color;

        return `
            <div style="flex:1;text-align:center;position:relative;">
                <div style="width:34px;height:34px;line-height:34px;margin:0 auto;border-radius:50%;background:${isDone ? color : 'var(--light-gray)'};color:#fff;font-size:0.9rem;${isCurrent ? 'box-shadow:0 0 0 3px rgba(245,124,0,0.3);transform:scale(1.1);' : ''}">
                    ${stage.icon}
                </div>
                <div style="font-size:0.75rem;color:${isDone ? '#2e7d32' : 'var(--text-light)'};font-weight:${isCurrent ? '700' : '400'};margin-top:0.35rem;">
                    ${stage.label}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div style="display:flex;align-items:flex-start;gap:0;margin-top:0.75rem;padding:0.75rem 0.25rem;border-top:1px solid var(--border);">
            ${timeline}
        </div>
    `;
}

async function cancelOrder(orderId, btn) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    const username = getLoggedInUsername();
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Cancelling...';
    }

    try {
        await apiCall(`/orders/cancel/${orderId}?username=${encodeURIComponent(username)}`, {
            method: 'POST'
        });
        showToast('Order cancelled successfully!');
        fetchMyOrders();
    } catch (error) {
        showToast(error.message || 'Failed to cancel order', 'error');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Cancel Order';
        }
    }
}

function emptyState(message, linkHref, linkText) {
    const link = linkHref
        ? `<a href="${linkHref}" class="btn btn-primary mt-2">${linkText}</a>`
        : '';
    return `
        <div class="empty-state">
            <div class="empty-icon">&#128196;</div>
            <h3>${message}</h3>
            ${link}
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof requireUserAuth === 'function') {
        requireUserAuth();
    }
    const content = document.getElementById('my-orders-content');
    if (content) {
        fetchMyOrders();
    }
});
