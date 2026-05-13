document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('admin-login-form');
    const errorEl = document.getElementById('admin-login-error');
    const submitBtn = document.getElementById('admin-login-submit');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        form.classList.add('was-validated');
        if (errorEl) {
            errorEl.classList.add('d-none');
            errorEl.textContent = '';
        }

        const username = document.getElementById('admin-username')?.value?.trim() || '';
        const password = document.getElementById('admin-password')?.value || '';

        if (submitBtn) {
            submitBtn.disabled = true;
        }

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || 'Sign-in failed.');
            }

            // After successful admin login, open the existing SYS dashboard.
            // Folder name contains a space, so we use the encoded URL.
            window.location.href = '/sys%20dashboard1/index.html';
        } catch (err) {
            if (errorEl) {
                errorEl.textContent = err.message || 'Could not sign in.';
                errorEl.classList.remove('d-none');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    });
});
