

let adminProducts = [];

async function fetchAdminProducts() {
    showLoading('admin-products-body');
    try {
        const data = await apiCall('/products');
        adminProducts = Array.isArray(data) ? data : (data.products || data.data || []);
        displayAdminProducts(adminProducts);
        updateDashboardStats();
    } catch (error) {
        const tbody = document.getElementById('admin-products-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:2rem;">Failed to load products</td></tr>`;
        }
        showToast(error.message, 'error');
    }
}


function displayAdminProducts(products) {
    const tbody = document.getElementById('admin-products-body');
    if (!tbody) return;

    /*
     * Dashboard shows a read-only product table (no action buttons).
     * The dedicated Products page shows Edit/Stock/Delete actions.
     */
    const isDashboard = window.location.pathname.toLowerCase().includes('dashboard');
    const colSpan = isDashboard ? 4 : 5;

    if (!products || products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center" style="padding:2rem;">No products found</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(product => {
        const id = getProductId(product);
        const name = getProductName(product);
        const price = getProductPrice(product);
        const stock = getProductStock(product);
        const stockClass = stock <= 5 ? 'color:#d32f2f;font-weight:600;' : '';
        const imageUrl = getProductImageUrl(product);
        const imageHtml = imageUrl
            ? `<img src="${imageUrl}" alt="${name}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` +
              `<span style="display:none;width:50px;height:50px;border-radius:6px;background:var(--light-gray);align-items:center;justify-content:center;">&#129472;</span>`
            : `<span style="width:50px;height:50px;border-radius:6px;background:var(--light-gray);display:flex;align-items:center;justify-content:center;">&#129472;</span>`;

        const actionsCell = isDashboard
            ? ''
            : `<td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal(${id})">Edit</button>
                    <button class="btn btn-accent btn-sm" onclick="openStockModal(${id}, '${name}', ${stock})">Stock</button>
                    <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${id}, '${name}')">Delete</button>
               </td>`;

        return `
            <tr>
                <td>${id}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        ${imageHtml}
                        <span>${name}</span>
                    </div>
                </td>
                <td>${formatCurrency(price)}</td>
                <td style="${stockClass}">${stock}</td>
                ${actionsCell}
            </tr>
        `;
    }).join('');
}

function updateDashboardStats() {
    const totalProducts = adminProducts.length;
    const totalStock = adminProducts.reduce((sum, p) => sum + getProductStock(p), 0);

    const statProducts = document.getElementById('stat-products');
    const statStock = document.getElementById('stat-stock');

    if (statProducts) statProducts.textContent = totalProducts;
    if (statStock) statStock.textContent = totalStock;
}


async function fetchOrders() {
    showLoading('admin-orders-body');
    try {
        const data = await apiCall('/orderDetails');
        /*
         * Adjust based on your Spring Boot order model.
         * If response is an array of orders, use directly.
         * If wrapped: data.orders, data.data, etc.
         */
        const orders = Array.isArray(data) ? data : (data.orders || data.data || []);
        displayAdminOrders(orders);

        const statOrders = document.getElementById('stat-orders');
        if (statOrders) statOrders.textContent = orders.length;
    } catch (error) {
        const tbody = document.getElementById('admin-orders-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:2rem;">Failed to load orders</td></tr>`;
        }
        showToast(error.message, 'error');
    }
}
function displayAdminOrders(orders) {
    const tbody = document.getElementById('admin-orders-body');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:2rem;">No orders found</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(order => {
        /*
         * Orders model fields: orderid, customer_name,
         * phone, email, address, total_price, product_id,
         * quantity, username, order_status
         */
        const orderId = order.orderid || order.id || 'N/A';
        const customerName = order.customer_name || order.customerName || 'N/A';
        const phone = order.phone || '';
        const email = order.email || '';
        const address = order.address || '';
        const totalAmount = order.total_price || order.totalAmount || 0;
        const productId = order.product_id || order.productId || '';
        const quantity = order.quantity || '';
        const status = (order.order_status || 'PLACED').toUpperCase();
        const cancelled = status === 'CANCELLED';

        const itemsText = quantity ? `Qty: ${quantity}${productId ? ` (Product #${productId})` : ''}` : 'Order placed';

        const statusOptions = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
        const statusCell = cancelled
            ? `<span style="color:#d32f2f;font-weight:600;">CANCELLED</span>`
            : `<select style="padding:0.3rem;border-radius:6px;border:1px solid var(--border);" onchange="updateOrderStatus(${orderId}, this.value)" aria-label="Order status">
                    ${statusOptions.map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${s}</option>`).join('')}
               </select>`;

        return `
            <tr>
                <td>#${orderId}</td>
                <td>
                    <div>${customerName}</div>
                    ${phone ? `<div style="font-size:0.8rem;color:var(--text-light);">${phone}</div>` : ''}
                    ${email ? `<div style="font-size:0.8rem;color:var(--text-light);">${email}</div>` : ''}
                </td>
                <td><span style="font-size:0.85rem;">${itemsText}</span></td>
                <td>${formatCurrency(totalAmount)}</td>
                <td>${statusCell}</td>
                <td style="font-size:0.85rem;">${address}</td>
            </tr>
        `;
    }).join('');
}

async function updateOrderStatus(orderId, status) {
    try {
        await apiCall(`/orders/status/${orderId}?status=${encodeURIComponent(status)}`, {
            method: 'POST'
        });
        showToast(`Order #${orderId} status updated to ${status}`);
        fetchOrders();
    } catch (error) {
        showToast(error.message || 'Failed to update status', 'error');
        fetchOrders();
    }
}

/* ============================================
   OPEN EDIT PRODUCT MODAL
   ============================================ */
function openEditModal(id) {
    const product = adminProducts.find(p => getProductId(p) === id);
    if (!product) return;

    document.getElementById('edit-product-id').value = id;
    document.getElementById('edit-product-name').value = getProductName(product);
    document.getElementById('edit-product-price').value = getProductPrice(product);
    document.getElementById('edit-product-stock').value = getProductStock(product);
    document.getElementById('edit-product-description').value = getProductDescription(product);

    const imagePreview = document.getElementById('edit-product-image-preview');
    if (imagePreview) {
        const imageUrl = getProductImageUrl(product);
        if (imageUrl) {
            imagePreview.innerHTML = `<img src="${imageUrl}" alt="Preview" onerror="this.parentElement.textContent='No image'">`;
        } else {
            imagePreview.textContent = 'No image';
        }
    }

    const imageFileField = document.getElementById('edit-product-image');
    if (imageFileField) {
        imageFileField.value = '';
    }

    document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

async function updateProduct() {
    const id = document.getElementById('edit-product-id').value;
    const name = document.getElementById('edit-product-name').value.trim();
    const price = parseFloat(document.getElementById('edit-product-price').value);
    const stock = parseInt(document.getElementById('edit-product-stock').value);
    const description = document.getElementById('edit-product-description').value.trim();

    if (!name || isNaN(price) || isNaN(stock)) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const payload = {
        product_name: name,
        price: price,
        stock_quantity: stock,
        description: description
    };

    try {
        await apiCall(`/update/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        const imageFile = document.getElementById('edit-product-image');
        if (imageFile && imageFile.files && imageFile.files[0]) {
            await uploadProductImage(id, imageFile.files[0]);
        }

        showToast('Product updated successfully!');
        closeEditModal();
        fetchAdminProducts();
    } catch (error) {
        showToast(error.message || 'Failed to update product', 'error');
    }
}

async function uploadProductImage(id, file) {
    const formData = new FormData();
    formData.append('image', file);
    await apiCallRaw(`/updateImage/${id}`, {
        method: 'PUT',
        body: formData
    });
}

/* ============================================
   OPEN STOCK UPDATE MODAL
   ============================================ */
function openStockModal(id, name, currentStock) {
    document.getElementById('stock-product-id').value = id;
    document.getElementById('stock-product-name').textContent = name;
    document.getElementById('stock-new-quantity').value = currentStock;
    document.getElementById('stock-modal').classList.add('active');
}

function closeStockModal() {
    document.getElementById('stock-modal').classList.remove('active');
}

async function updateStock() {
    const id = document.getElementById('stock-product-id').value;
    const quantity = parseInt(document.getElementById('stock-new-quantity').value);

    if (isNaN(quantity) || quantity < 0) {
        showToast('Please enter a valid stock quantity', 'error');
        return;
    }

    try {
        await apiCall(`/updateStock/${id}?stock_quantity=${quantity}`, {
            method: 'PUT'
        });
        showToast('Stock updated successfully!');
        closeStockModal();
        fetchAdminProducts();
    } catch (error) {
        showToast(error.message || 'Failed to update stock', 'error');
    }
}

/* ============================================
   DELETE PRODUCT
   ============================================ */
function openDeleteModal(id, name) {
    document.getElementById('delete-product-id').value = id;
    document.getElementById('delete-product-name').textContent = name;
    document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
}

async function deleteProduct() {
    const id = document.getElementById('delete-product-id').value;
    const btn = document.querySelector('#delete-modal .btn-danger');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Deleting...';
    }

    try {
        await apiCall(`/deleteProduct/${id}`, {
            method: 'DELETE'
        });
        showToast('Product deleted successfully!');
        closeDeleteModal();
        fetchAdminProducts();
    } catch (error) {
        showToast(error.message || 'Failed to delete product', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Delete Product';
        }
    }
}

async function createProduct() {
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const description = document.getElementById('product-description').value.trim();

    let hasError = false;

    // Clear errors
    document.querySelectorAll('.admin-form .form-group').forEach(g => g.classList.remove('error'));

    if (!name) {
        document.getElementById('product-name').closest('.form-group').classList.add('error');
        hasError = true;
    }
    if (isNaN(price) || price <= 0) {
        document.getElementById('product-price').closest('.form-group').classList.add('error');
        hasError = true;
    }
    if (isNaN(stock) || stock < 0) {
        document.getElementById('product-stock').closest('.form-group').classList.add('error');
        hasError = true;
    }

    if (hasError) {
        showToast('Please fill in all required fields correctly', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('productName', name);
    formData.append('price', price);
    formData.append('stock_quantity', stock);
    formData.append('description', description);

    const imageField = document.getElementById('product-image');
    if (imageField && imageField.files && imageField.files[0]) {
        formData.append('image', imageField.files[0]);
    }

    const btn = document.querySelector('.admin-form .btn-primary');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creating...';
    }

    try {
        await apiCallRaw('/createProductWithImage', {
            method: 'POST',
            body: formData
        });
        showToast('Product created successfully!');

        // Clear form
        document.getElementById('add-product-form').reset();
        const preview = document.getElementById('product-image-preview');
        if (preview) preview.textContent = 'No image selected';
    } catch (error) {
        showToast(error.message || 'Failed to create product', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Add Product';
        }
    }
}

/* ============================================
   REGISTER A NEW ADMIN
   ============================================ */
async function registerAdmin() {
    const username = document.getElementById('admin-new-username').value.trim();
    const password = document.getElementById('admin-new-password').value;
    const confirmPassword = document.getElementById('admin-confirm-password').value;

    // Clear previous errors
    document.querySelectorAll('#add-admin-form .form-group').forEach(g => g.classList.remove('error'));

    let hasError = false;

    function markError(id, hasErr) {
        const group = document.getElementById(id).closest('.form-group');
        group.classList.toggle('error', hasErr);
        return hasErr;
    }

    if (!username) {
        markError('admin-new-username', true);
        hasError = true;
    }
    if (!password) {
        markError('admin-new-password', true);
        hasError = true;
    }
    if (password !== confirmPassword) {
        markError('admin-confirm-password', true);
        hasError = true;
    }

    if (hasError) {
        showToast('Please fill in all required fields correctly', 'error');
        return;
    }

    const btn = document.querySelector('#add-admin-form .btn-primary');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creating...';
    }

    try {
        await apiCall('/adminRegister', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        showToast('New admin created successfully!');
        document.getElementById('add-admin-form').reset();
    } catch (error) {
        showToast(error.message || 'Failed to create admin', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Create Admin';
        }
    }
}

/* ============================================
   MOBILE SIDEBAR TOGGLE
   ============================================ */
function toggleAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width:150px;max-height:150px;border-radius:6px;">`;
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.textContent = 'No image selected';
    }
}

function resetProductPreview() {
    const preview = document.getElementById('product-image-preview');
    if (preview) preview.textContent = 'No image selected';
}

/* ============================================
   INIT ADMIN PAGES
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Check auth on admin pages (except login)
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'login.html' && window.location.pathname.includes('/admin/')) {
        requireAdminAuth();
    }

    // Dashboard
    if (document.getElementById('stat-products')) {
        fetchAdminProducts();
        fetchOrders();
    }

    // Admin Products page
    if (document.getElementById('admin-products-body')) {
        fetchAdminProducts();
    }

    // Admin Orders page
    if (document.getElementById('admin-orders-body')) {
        fetchOrders();
    }

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
});
