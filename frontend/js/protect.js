const loggedInUser = sessionStorage.getItem('loggedInUser');
const isLoginPage = window.location.pathname === '/' || window.location.pathname.startsWith('/login');

if (!loggedInUser && !isLoginPage) {
    // Se não está logado E não está na página de login, redireciona para o login
    window.location.href = '/';
} else if (loggedInUser && isLoginPage) {
    // Se está logado E está tentando acessar a página de login, redireciona para o dashboard
    window.location.href = '/dashboard';
}