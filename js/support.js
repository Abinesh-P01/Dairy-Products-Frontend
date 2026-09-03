/* ============================================
   SUPPORT CHAT PAGE LOGIC
   User sends a support message; admin replies
   are shown in the same thread.
   Backend:
     GET  /support/{username}
     POST /support/send
   ============================================ */

const SUPPORT_REFRESH_MS = 8000;

async function fetchSupportMessages() {
    const username = getLoggedInUsername();
    const container = document.getElementById('support-messages');
    if (!container || !username) return;

    try {
        const data = await apiCall(`/support/${encodeURIComponent(username)}`);
        const messages = Array.isArray(data) ? data : (data.messages || data.data || []);
        renderSupportMessages(messages);
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">&#128172;</div><h3>Could not load messages</h3><p>${error.message}</p></div>`;
    }
}

function renderSupportMessages(messages) {
    const container = document.getElementById('support-messages');
    if (!container) return;

    if (!messages || messages.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">&#128172;</div><h3>No messages yet</h3><p>Send us a message and we'll respond shortly.</p></div>`;
        return;
    }

    container.innerHTML = messages.map(m => {
        const status = (m.status || '').toUpperCase();
        const replyHtml = m.reply
            ? `<div style="margin-top:0.75rem;padding-left:1rem;border-left:3px solid var(--primary);">
                    <div style="font-size:0.8rem;color:var(--text-light);font-weight:600;">SUPPORT REPLY</div>
                    <div style="color:var(--text);">${escapeHtml(m.reply)}</div>
               </div>`
            : '';

        return `
            <div style="background:var(--light-gray);border-radius:6px;padding:0.85rem 1rem;margin-bottom:0.75rem;">
                <div style="font-size:0.75rem;color:var(--text-light);font-weight:600;margin-bottom:0.25rem;">
                    YOU &middot; ${status || 'OPEN'}
                </div>
                <div style="color:var(--text);">${escapeHtml(m.message)}</div>
                ${replyHtml}
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

async function sendSupportMessage() {
    const messageInput = document.getElementById('support-message');
    const message = messageInput.value.trim();
    const username = getLoggedInUsername();

    if (!username) {
        showToast('Please login to contact support', 'error');
        return;
    }
    if (!message) {
        showToast('Please enter a message', 'error');
        return;
    }

    try {
        await apiCall('/support/send', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                message: message,
                sender: 'USER',
                status: 'OPEN'
            })
        });
        messageInput.value = '';
        showToast('Message sent! We will reply soon.');
        fetchSupportMessages();
    } catch (error) {
        showToast(error.message || 'Failed to send message', 'error');
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof requireUserAuth === 'function') {
        requireUserAuth();
    }
    fetchSupportMessages();
    setInterval(fetchSupportMessages, SUPPORT_REFRESH_MS);
});
