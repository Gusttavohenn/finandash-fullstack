// frontend/js/protect.js

const loggedInUser = sessionStorage.getItem('loggedInUser');

if (!loggedInUser) {
    // Se não há usuário logado, simplesmente redireciona para a página de login.
    window.location.href = '/login';
}