/* ============================================
   PRODUCTS PAGE LOGIC
   ============================================ */

let allProducts = [];

/*
 * Track the active filters/sort separately from the master list (allProducts).
 * allProducts always holds the complete, unfiltered product set, so clearing
 * any filter or search restores the full list.
 */
const productState = {
    query: '',
    minPrice: '',
    maxPrice: '',
    sort: 'default'
};

/* ============================================
   FETCH ALL PRODUCTS
   ============================================ */
async function fetchProducts() {
    showLoading('products-grid');
    try {
        const data = await apiCall('/products');
        /*
         * If your backend returns an array directly, use data.
         * If wrapped in an object like { products: [...] },
         * change to: allProducts = data.products;
         */
        allProducts = Array.isArray(data) ? data : (data.products || data.data || []);
        displayProducts(getFilteredProducts());
    } catch (error) {
        showEmptyState('products-grid', 'Failed to load products');
        showToast(error.message, 'error');
    }
}

/*
 * Apply the active search, price range and sort to the full `allProducts`
 * list. This runs entirely on the client so the different filters compose
 * together and clearing any of them restores all products.
 */
function getFilteredProducts() {
    let result = allProducts.slice();

    if (productState.query) {
        const q = productState.query.toLowerCase();
        result = result.filter(p => getProductName(p).toLowerCase().includes(q));
    }

    if (productState.minPrice !== '' || productState.maxPrice !== '') {
        const min = productState.minPrice === '' ? -Infinity : parseFloat(productState.minPrice);
        const max = productState.maxPrice === '' ? Infinity : parseFloat(productState.maxPrice);
        result = result.filter(p => {
            const price = getProductPrice(p);
            return price >= min && price <= max;
        });
    }

    if (productState.sort === 'asc') {
        result.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    } else if (productState.sort === 'desc') {
        result.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    }

    return result;
}

/* ============================================
   DISPLAY PRODUCTS IN GRID
   ============================================ */
function displayProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (!products || products.length === 0) {
        showEmptyState('products-grid', 'No products found');
        return;
    }

    grid.innerHTML = products.map(product => {
        const id = getProductId(product);
        const name = getProductName(product);
        const price = getProductPrice(product);
        const stock = getProductStock(product);
        const description = getProductDescription(product);
        const image = getProductImage(product);

        const imageHtml = image
            ? `<img src="${image}" alt="${name}" onerror="this.parentElement.innerHTML='&#129472;'">`
            : '&#129472;';

        const stockClass = stock <= 5 ? 'low-stock' : '';
        const stockText = stock <= 0 ? 'Out of Stock' : `${stock} in stock`;

        return `
            <div class="product-card">
                <div class="product-image" onclick="viewProduct(${id})">
                    ${imageHtml}
                </div>
                <div class="product-info">
                    <h3 class="product-name" onclick="viewProduct(${id})">${name}</h3>
                    <div class="product-price">${formatCurrency(price)}</div>
                    <div class="product-stock ${stockClass}">${stockText}</div>
                    ${description ? `<p class="product-description">${description}</p>` : ''}
                    <div class="product-actions">
                        <button class="btn btn-secondary btn-sm" onclick="addToCart(${id})" ${stock <= 0 ? 'disabled' : ''}>
                            Add to Cart
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="buyNow(${id})" ${stock <= 0 ? 'disabled' : ''}>
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* ============================================
   VIEW PRODUCT DETAILS
   ============================================ */
function viewProduct(id) {
    window.location.href = `product-details.html?id=${id}`;
}

/* ============================================
   SEARCH PRODUCTS BY NAME
   ============================================ */
let searchTimeout;
function searchProducts() {
    const query = document.getElementById('search-input').value.trim();
    clearTimeout(searchTimeout);

    // Store the query so filters/sort can compose and clearing restores all products
    productState.query = query;

    searchTimeout = setTimeout(() => {
        displayProducts(getFilteredProducts());
    }, 300);
}

/* ============================================
   FILTER PRODUCTS BY PRICE
   ============================================ */
function filterProductsByPrice() {
    const min = document.getElementById('min-price').value.trim();
    const max = document.getElementById('max-price').value.trim();

    productState.minPrice = min;
    productState.maxPrice = max;

    displayProducts(getFilteredProducts());
}

/* ============================================
   SORT PRODUCTS
   ============================================ */
function sortProducts() {
    const sortValue = document.getElementById('sort-select').value;

    productState.sort = sortValue;

    displayProducts(getFilteredProducts());
}

/* ============================================
   ADD TO CART FROM PRODUCTS PAGE
   ============================================ */
function addToCart(id) {
    const product = allProducts.find(p => getProductId(p) === id);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }
    addToCartHelper(product);
}

/* ============================================
   BUY NOW
   ============================================ */
function buyNow(id) {
    const product = allProducts.find(p => getProductId(p) === id);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }
    addToCartHelper(product, 1);
    window.location.href = 'cart.html';
}

/* ============================================
   INIT PRODUCTS PAGE
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        fetchProducts();
    }
});
