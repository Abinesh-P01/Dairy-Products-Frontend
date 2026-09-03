
const API_BASE_URL = 'http://localhost:8080';

async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (options.headers) {
        if (!options.headers['Content-Type'] && options.headers['content-type']) {
            options.headers['Content-Type'] = options.headers['content-type'];
        }
    }

    const mergedOptions = { ...defaultOptions, ...options };
    const hasExplicitContentType = options.headers && (options.headers['Content-Type'] || options.headers['content-type']);

    if (!hasExplicitContentType && options.body && !(options.body instanceof FormData)) {
        mergedOptions.headers = { 'Content-Type': 'application/json' };
    } else if (options.body instanceof FormData) {
        delete mergedOptions.headers['Content-Type'];
    }

    try {
        const response = await fetch(url, mergedOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        const text = await response.text();
        return text;
    } catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error('Network error. Please check if the backend server is running.');
        }
        throw error;
    }
}

async function apiCallRaw(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        const text = await response.text();
        return text;
    } catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error('Network error. Please check if the backend server is running.');
        }
        throw error;
    }
}


function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: '&#10004;',
        error: '&#10006;',
        warning: '&#9888;'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.success}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 3000);
}


function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}

function showLoading(containerId) {
    const el = document.getElementById(containerId);
    if (el) {
        el.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

function showEmptyState(containerId, message = 'No items found') {
    const el = document.getElementById(containerId);
    if (el) {
        el.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>${message}</h3>
                <p>Try adjusting your search or filters.</p>
            </div>
        `;
    }
}

function hasProductImage(product) {
    if (!product) return false;
    if (product.image && product.image.length > 0) return true;
    if (product.imageType) return true;
    if (product.imageUrl) return true;
    return false;
}

function getProductImageUrl(product) {
    const id = getProductId(product);
    if (id !== null) {
        return `${API_BASE_URL}/image/${id}`;
    }
    return null;
}

function getProductImage(product) {
    if (!product) return null;
    if (product.imageUrl) return product.imageUrl;
    if (product.image && product.image.length > 0 && product.imageType) {
        return `data:${product.imageType};base64,${product.image}`;
    }
    if (product.image && product.image.length > 0) {
        return `data:image/jpeg;base64,${product.image}`;
    }
    const id = getProductId(product);
    if (id !== null) {
        return `${API_BASE_URL}/image/${id}`;
    }
    return null;
}

function getProductDescription(product) {
    /* Products model field: description */
    if (product.description) return product.description;
    if (product.productDescription) return product.productDescription;
    if (product.details) return product.details;
    if (product.desc) return product.desc;
    return '';
}

function getProductName(product) {
    /* Products model field: productName (JSON key) */
    if (product.productName) return product.productName;
    if (product.name) return product.name;
    if (product.title) return product.title;
    if (product.product_name) return product.product_name;
    return 'Untitled Product';
}

function getProductPrice(product) {
    /* Products model field: price */
    if (product.price !== undefined) return product.price;
    if (product.productPrice !== undefined) return product.productPrice;
    if (product.cost !== undefined) return product.cost;
    return 0;
}

function getProductStock(product) {
    /* Products model field: stock_quantity (JSON key) */
    if (product.stock_quantity !== undefined) return product.stock_quantity;
    if (product.stockQuantity !== undefined) return product.stockQuantity;
    if (product.stock !== undefined) return product.stock;
    if (product.quantity !== undefined) return product.quantity;
    return 0;
}

function getProductId(product) {
    /* Products model field: product_id (JSON key) */
    if (product.product_id !== undefined) return product.product_id;
    if (product.id !== undefined) return product.id;
    if (product.productId !== undefined) return product.productId;
    return null;
}

/* ============================================
   MOBILE NAV TOGGLE
   ============================================ */
function setupMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

/* ============================================
   UPDATE NAVBAR CART BADGE
   ============================================ */
function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        const cart = getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

/* ============================================
   ACTIVE NAV LINK
   ============================================ */
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    setupMobileNav();
    updateCartBadge();
    setActiveNavLink();
});
