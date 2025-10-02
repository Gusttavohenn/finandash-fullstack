const loggedInUser = sessionStorage.getItem('loggedInUser');

if (!loggedInUser) {
    window.location.href = '/login';
}