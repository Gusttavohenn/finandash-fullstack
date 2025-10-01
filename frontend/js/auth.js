document.addEventListener('DOMContentLoaded', () => {
    const loginFormContainer = document.getElementById('login-form-container');
    const signupFormContainer = document.getElementById('signup-form-container');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    // A URL base do nosso backend. É importante ter isso em um lugar só.
    const API_URL = 'http://localhost:3000/api';

    // Lógica para alternar entre os formulários (sem alterações)
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

    // --- LÓGICA DE CADASTRO ATUALIZADA ---
    signupForm.addEventListener('submit', async (e) => { // A função agora é 'async'
        e.preventDefault();
        signupError.textContent = '';

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        // Bloco try...catch para lidar com erros de rede
        try {
            // 1. Inicia a requisição para o backend
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST', // Usamos POST para enviar dados
                headers: {
                    'Content-Type': 'application/json', // Avisamos que estamos enviando JSON
                },
                body: JSON.stringify({ name, email, password }), // Converte nosso objeto JS em texto JSON
            });

            // 2. Converte a resposta do backend (que também é JSON) em um objeto JS
            const data = await response.json();

            // 3. Verifica se a requisição foi bem-sucedida (status 2xx)
            if (!response.ok) {
                // Se não foi, lança um erro com a mensagem que o backend enviou
                throw new Error(data.message || 'Erro ao cadastrar.');
            }

            // 4. Se chegou aqui, o cadastro foi um sucesso
            alert('Conta criada com sucesso! Por favor, faça o login.');
            showLogin.click();

        } catch (error) {
            // Captura qualquer erro (de rede ou lançado por nós) e exibe na tela
            signupError.textContent = error.message;
        }
    });

    // --- LÓGICA DE LOGIN ATUALIZADA ---
    loginForm.addEventListener('submit', async (e) => { // A função agora é 'async'
        e.preventDefault();
        loginError.textContent = '';
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            // 1. Envia as credenciais para o endpoint de login
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao fazer login.');
            }
            
            // 2. Se o login foi bem-sucedido, o backend nos devolveu os dados e o token
            // Salvamos ambos na sessionStorage para usar no app principal
            sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));
            sessionStorage.setItem('authToken', data.token); // SALVA O TOKEN!
            
            // 3. Redireciona para o dashboard
            window.location.href = 'index.html';

        } catch (error) {
            loginError.textContent = error.message;
        }
    });
});