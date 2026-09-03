# Lumina — Frontend

Frontend web client for **Lumina**, a dairy e-commerce application. It is a pure HTML/CSS/JavaScript (vanilla) interface that talks to the Spring Boot backend over REST.

## Tech Stack

- HTML5 + CSS3 (custom `style.css`, `admin.css`, `responsive.css`)
- Vanilla JavaScript (no build step, no framework)
- REST calls to the Spring Boot backend via `js/api.js`

## Project Structure

```
dairy-products-frontend/
├── index.html              # Home / landing page
├── products.html           # Browse & search products
├── product-details.html    # Single product view
├── cart.html               # Shopping cart
├── checkout.html           # Checkout (creates orders)
├── login.html              # User login
├── user-register.html      # User registration
├── my-orders.html          # User's orders + tracking timeline
├── support.html            # User → admin support chat
├── admin/                  # Admin panel
│   ├── login.html          # Admin login
│   ├── dashboard.html      # Overview stats
│   ├── products.html       # Manage products
│   ├── add-product.html    # Add new product
│   ├── orders.html         # View orders + update status
│   ├── support.html        # View/reply to support messages
│   └── add-admin.html      # Register another admin
├── css/
│   ├── style.css           # Global & storefront styles
│   ├── responsive.css      # Responsive/mobile styles
│   └── admin.css           # Admin panel styles
└── js/
    ├── api.js              # API base URL + apiCall/showToast/formatCurrency helpers
    ├── user.js             # Login/register, session (dairy_user_logged_in / dairy_user_name)
    ├── cart.js             # Cart logic
    ├── products.js         # Product list/search/filter/sort
    ├── checkout.js         # Place order
    ├── my-orders.js        # My Orders + status timeline + cancel
    ├── support.js          # User support chat
    ├── admin.js            # Admin products/orders logic
    ├── admin-support.js    # Admin support reply logic
    └── login.js            # Auth helpers (admin requireAdminAuth, etc.)
```

## Getting Started

1. **Start the backend** (Spring Boot, on `http://localhost:8080`).
2. **Serve this folder** with any static server, e.g.:

   ```bash
   # Python
   python -m http.server 5500
   ```
   or open the `.html` files directly in a browser.

3. Open the served URL and browse the store.

### API Base URL

All requests go to `http://localhost:8080` by default, defined in `js/api.js`:

```js
const API_BASE_URL = 'http://localhost:8080';
```

Update this if the backend runs on a different host/port, or to enable [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) on the backend if the page is served from another origin.

## Feature Overview

### Storefront (user)

- **Browsing** — `products.html` with search, price filter, and sort.
- **Cart** — add/remove items in `cart.html`; cart badge updates across pages.
- **Checkout** — `checkout.html` creates one order per cart item server-side, linking the order to the logged-in username.
- **My Orders & Tracking** — `my-orders.html` lists the user's orders with a status timeline (`PLACED → PROCESSING → SHIPPED → DELIVERED`), and allows cancelling (which restocks).
- **Support chat** — `support.html` sends messages to admins and shows admin replies (auto-refresh).
- **Auth** — login/register stored in `sessionStorage` under `dairy_user_logged_in` / `dairy_user_name`.

### Admin Panel (`/admin`)

- Login, then manage products (add/edit/delete/stock), view orders and update their status, and answer user support messages.

## Session / Auth Keys

| Key | Purpose |
| --- | --- |
| `dairy_user_logged_in` | Marks the current user as logged in |
| `dairy_user_name` | Stores the logged-in username |

These are read by pages such as `my-orders.js` and `support.js` to scope data to the current user.

## Backend API Endpoints Used

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/products` | List products |
| `GET` | `/image/{productId}` | Product image |
| `POST` | `/userRegister` | Register a user |
| `POST` | `/userLogin` | Login a user |
| `POST` | `/createorders` | Place an order (per cart item) |
| `GET` | `/orders/{username}` | Orders for a user |
| `GET` | `/order/{orderId}` | Single order (tracking) |
| `POST` | `/orders/cancel/{orderId}` | Cancel an order (restocks) |
| `POST` | `/orders/status/{orderId}` | Update order status (admin) |
| `POST` | `/support/send` | Send a support message |
| `GET` | `/support/{username}` | Support messages for a user |
| `GET` | `/support/all` | All support messages (admin) |
| `POST` | `/support/reply/{messageId}` | Reply to a support message (admin) |
| `GET` | `/orderDetails` | All orders (admin) |
| `POST` | `/adminLogin` | Admin login |

## Notes

- There is **no build step** — edit the files and refresh the browser.
- If the frontend and backend are served from different origins, ensure the backend allows CORS (or serve frontend on `localhost` alongside it).
