// Este script verifica se existe um usuário logado na sessão.
// Se não houver, ele redireciona o usuário para a página de login.

const loggedInUser = sessionStorage.getItem('loggedInUser');

if (!loggedInUser) {
    // Se não encontrou dados do usuário, volta para o login
    window.location.href = '/login'
}