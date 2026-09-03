/* ============================================
   ADMIN LOGIN LOGIC
   ============================================ */

const ADMIN_SESSION_KEY = 'dairy_admin_logged_in';

/* ============================================
   ADMIN LOGIN FUNCTION
   ============================================ */
async function adminLogin() {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();

    // Clear previous errors
    document.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));

    let hasError = false;

    if (!username) {
        const group = document.getElementById('admin-username').closest('.form-group');
        group.classList.add('error');
        const errText = group.querySelector('.error-text');
        if (errText) errText.textContent = 'Username is required';
        hasError = true;
    }

    if (!password) {
        const group = document.getElementById('admin-password').closest('.form-group');
        group.classList.add('error');
        const errText = group.querySelector('.error-text');
        if (errText) errText.textContent = 'Password is required';
        hasError = true;
    }

    if (hasError) return;

    const btn = document.getElementById('login-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Logging in...';
    }

    try {
        const response = await apiCall('/adminLogin', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        /*
         * Your backend returns "success" or "failure" as text.
         * Adjust this check if your response format is different.
         */
        const responseText = typeof response === 'string' ? response : JSON.stringify(response);

        if (responseText.toLowerCase().includes('success')) {
            sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
            sessionStorage.removeItem(USER_SESSION_KEY);
            sessionStorage.setItem('admin_username', username);
            showToast('Login successful!');
            const isInAdminFolder = window.location.pathname.includes('/admin/');
            window.location.href = isInAdminFolder ? 'dashboard.html' : 'admin/dashboard.html';
        } else {
            showToast('Invalid username or password', 'error');
            const group = document.getElementById('admin-password').closest('.form-group');
            group.classList.add('error');
        }
    } catch (error) {
        showToast(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    }
}

/* ============================================
   SWITCH LOGIN TAB (User / Admin)
   ============================================ */
function switchLoginTab(tab) {
    document.querySelectorAll('.login-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-tab') === tab);
    });
    document.getElementById('user-panel').classList.toggle('active', tab === 'user');
    document.getElementById('admin-panel').classList.toggle('active', tab === 'admin');
}

/* ============================================
   CHECK ADMIN AUTH
   ============================================ */
function isAdminLoggedIn() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

/*
 * Admin logout redirects to the unified login page.
 * Path is resolved relative to current page.
 */
function adminLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem('admin_username');
    const base = adminBasePath();
    window.location.href = base + 'login.html';
}

function requireAdminAuth() {
    if (!isAdminLoggedIn()) {
        const base = adminBasePath();
        window.location.href = base + 'login.html';
        return false;
    }
    return true;
}

/*
 * Helper to compute correct relative path to root login.html
 */
function adminBasePath() {
    return window.location.pathname.includes('/admin/') ? '../' : '';
}

/* ============================================
   INIT LOGIN PAGE
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            adminLogin();
        });
    }

    // Open the requested tab (default: user)
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'admin') {
        switchLoginTab('admin');
    } else {
        switchLoginTab('user');
    }
});
