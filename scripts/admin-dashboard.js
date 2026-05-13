document.addEventListener('DOMContentLoaded', () => {
    const nameEl = document.getElementById('admin-display-name');
    const logoutBtn = document.getElementById('logout-btn');

    fetch('/api/admin/me', { credentials: 'same-origin' })
        .then((r) => r.json())
        .then((data) => {
            if (data.loggedIn && data.username && nameEl) {
                nameEl.textContent = data.username;
            }
        })
        .catch(() => {});

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            logoutBtn.disabled = true;
            try {
                await fetch('/api/admin/logout', {
                    method: 'POST',
                    credentials: 'same-origin',
                });
            } finally {
                window.location.href = '/admin/login.html';
            }
        });
    }
});
