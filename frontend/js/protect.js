const loggedInUser = localStorage.getItem('loggedInUser');

if (!loggedInUser) {
    window.location.href = '/login';
}