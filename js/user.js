/* ============================================
   USER AUTH LOGIC (Login / Register)
   Backend endpoints:
     POST /userLogin    -> "success" | "failure"
     POST /userRegister -> Users JSON object
   Users model: user_id, username, email, password
   ============================================ */

const USER_SESSION_KEY = 'dairy_user_logged_in';
const USER_NAME_KEY = 'dairy_user_name';

/* ============================================
   USER LOGIN
   ============================================ */
async function userLogin() {
    const username = document.getElementById('user-username').value.trim();
    const password = document.getElementById('user-password').value.trim();

    clearFormErrors('user-login-form');

    let hasError = false;
    if (!username) {
        setFieldError('user-username', 'Username is required');
        hasError = true;
    }
    if (!password) {
        setFieldError('user-password', 'Password is required');
        hasError = true;
    }
    if (hasError) return;

    const btn = document.getElementById('user-login-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }

    try {
        const response = await apiCall('/userLogin', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        const text = typeof response === 'string' ? response : JSON.stringify(response);

        if (text.toLowerCase().includes('success')) {
            sessionStorage.setItem(USER_SESSION_KEY, 'true');
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            sessionStorage.setItem(USER_NAME_KEY, username);
            updateUserNav();
            showToast('Login successful!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            showToast('Invalid username or password', 'error');
            setFieldError('user-password', 'Invalid username or password');
        }
    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Login'; }
    }
}

/* ============================================
   USER REGISTER
   ============================================ */
async function userRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const confirmPassword = document.getElementById('reg-confirm-password').value.trim();

    clearFormErrors('user-register-form');

    let hasError = false;
    if (!username) {
        setFieldError('reg-username', 'Username is required');
        hasError = true;
    }
    if (!email) {
        setFieldError('reg-email', 'Email is required');
        hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError('reg-email', 'Please enter a valid email');
        hasError = true;
    }
    if (!password) {
        setFieldError('reg-password', 'Password is required');
        hasError = true;
    } else if (password.length < 6) {
        setFieldError('reg-password', 'Password must be at least 6 characters');
        hasError = true;
    }
    if (password !== confirmPassword) {
        setFieldError('reg-confirm-password', 'Passwords do not match');
        hasError = true;
    }
    if (hasError) return;

    const btn = document.getElementById('user-register-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Creating account...'; }

    try {
        await apiCall('/userRegister', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });

        showToast('Account created! Please login.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 800);
    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
    }
}

/* ============================================
   SESSION HELPERS
   ============================================ */
function isUserLoggedIn() {
    return sessionStorage.getItem(USER_SESSION_KEY) === 'true';
}

function getLoggedInUsername() {
    return sessionStorage.getItem(USER_NAME_KEY) || '';
}

function userLogout() {
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem(USER_NAME_KEY);
    updateUserNav();
    showToast('Logged out successfully');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

/* ============================================
   REQUIRE USER LOGIN (protect customer pages)
   Redirects to login page if not authenticated.
   ============================================ */
function requireUserAuth() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/* ============================================
   UPDATE NAVBAR BASED ON LOGIN STATE
   ============================================ */
function updateUserNav() {
    const authLink = document.getElementById('nav-auth-link');
    if (!authLink) return;

    if (isUserLoggedIn()) {
        authLink.innerHTML = `<a href="#" onclick="userLogout(); return false;">Logout (${getLoggedInUsername()})</a>`;
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
}

/* ============================================
   FORM ERROR HELPERS
   ============================================ */
function setFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const group = input.closest('.form-group');
    if (group) {
        group.classList.add('error');
        const errText = group.querySelector('.error-text');
        if (errText) errText.textContent = message;
    }
}

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
    }
}

/* ============================================
   INIT
   ============================================ */
/*
 * Pages that require a logged-in user.
 * The login page itself and register page are excluded.
 */
const PROTECTED_PAGES = [
    'index.html',
    'products.html',
    'product-details.html',
    'cart.html',
    'checkout.html'
];

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    // Protect customer pages (but not the login/register pages)
    if (PROTECTED_PAGES.includes(currentPage) && !isUserLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    updateUserNav();

    const loginForm = document.getElementById('user-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            userLogin();
        });
    }

    const registerForm = document.getElementById('user-register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            userRegister();
        });
    }
});
