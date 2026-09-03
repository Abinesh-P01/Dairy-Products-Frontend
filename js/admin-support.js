/* ============================================
   ADMIN SUPPORT PAGE LOGIC
   Lists all support messages and lets the admin
   reply to each one.
   Backend:
     GET  /support/all
     POST /support/reply/{messageId}?reply=X
   ============================================ */

async function fetchAllSupportMessages() {
    const content = document.getElementById('admin-support-content');
    if (!content) return;

    content.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading messages...</p>
        </div>
    `;

    try {
        const data = await apiCall('/support/all');
        const messages = Array.isArray(data) ? data : (data.messages || data.data || []);
        renderAllSupportMessages(messages);
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><h3>Failed to load messages</h3><p>${error.message}</p></div>`;
    }
}

function renderAllSupportMessages(messages) {
    const content = document.getElementById('admin-support-content');
    if (!content) return;

    if (!messages || messages.length === 0) {
        content.innerHTML = `<div class="empty-state"><div class="empty-icon">&#128172;</div><h3>No support messages</h3></div>`;
        return;
    }

    const sorted = messages.slice().sort((a, b) => (a.message_id || 0) - (b.message_id || 0));

    content.innerHTML = sorted.map(m => {
        const status = (m.status || 'OPEN').toUpperCase();
        const statusColor = status === 'REPLIED' ? '#2e7d32' : '#f57c00';
        const replied = status === 'REPLIED';

        return `
            <div style="background:var(--white);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                    <strong>${escapeHtml(m.username || 'Unknown')}</strong>
                    <span style="font-size:0.8rem;color:${statusColor};font-weight:600;">${status}</span>
                </div>
                <div style="margin-top:0.5rem;color:var(--text);">${escapeHtml(m.message || '')}</div>
                ${m.reply ? `<div style="margin-top:0.5rem;padding-left:0.75rem;border-left:3px solid var(--primary);color:var(--text-light);">Reply: ${escapeHtml(m.reply)}</div>` : ''}
                <div style="margin-top:0.75rem;text-align:right;">
                    <button class="btn btn-primary btn-sm" onclick="openReplyModal(${m.message_id}, '${escapeQuote(m.username || '')}', '${escapeQuote(m.message || '')}')">
                        ${replied ? 'Reply Again' : 'Reply'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function openReplyModal(id, username, message) {
    document.getElementById('reply-message-id').value = id;
    document.getElementById('reply-username').textContent = username;
    document.getElementById('reply-message-text').textContent = message;
    document.getElementById('reply-text').value = '';
    document.getElementById('reply-modal').classList.add('active');
}

function closeReplyModal() {
    document.getElementById('reply-modal').classList.remove('active');
}

async function sendReply() {
    const id = document.getElementById('reply-message-id').value;
    const reply = document.getElementById('reply-text').value.trim();

    if (!reply) {
        showToast('Please enter a reply', 'error');
        return;
    }

    try {
        await apiCall(`/support/reply/${id}?reply=${encodeURIComponent(reply)}`, {
            method: 'POST'
        });
        showToast('Reply sent successfully!');
        closeReplyModal();
        fetchAllSupportMessages();
    } catch (error) {
        showToast(error.message || 'Failed to send reply', 'error');
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function escapeQuote(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-support-content')) {
        fetchAllSupportMessages();
    }
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
});
