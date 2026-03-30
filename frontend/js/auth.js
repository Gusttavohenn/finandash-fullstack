document.addEventListener('DOMContentLoaded', () => {
    const loginFormContainer = document.getElementById('login-form-container');
    const signupFormContainer = document.getElementById('signup-form-container');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            btn.querySelector('i').className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    });

    // API_URL definido em config.js

    /**
     * @param {string} message 
     * @param {string} type 
     */
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    const demoBtn = document.getElementById('demo-btn');
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            localStorage.setItem('demoMode', 'true');
            window.location.href = '/index.html';
        });
    }

    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.add('hidden');
        signupFormContainer.classList.remove('hidden');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupError.textContent = '';

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const btn = signupForm.querySelector('button[type="submit"]');

        if (password.length < 6) {
            signupError.textContent = 'A senha deve ter no mínimo 6 caracteres.';
            return;
        }
        if (password !== confirmPassword) {
            signupError.textContent = 'As senhas não coincidem.';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Criando conta...';
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao cadastrar.');
            }

            showToast('Conta criada com sucesso! Por favor, faça o login.', 'success');
            showLogin.click();

        } catch (error) {
            signupError.textContent = error.message;
        } finally {
            btn.disabled = false;
            btn.textContent = 'Criar Conta';
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = loginForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Entrando...';
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao fazer login.');
            }
            localStorage.setItem('loggedInUser', JSON.stringify(data.user));
            localStorage.setItem('authToken', data.token);
            window.location.href = '/index.html';
        } catch (error) {
            loginError.textContent = error.message;
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    });
});