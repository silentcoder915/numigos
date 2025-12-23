// Auth state management
let currentUser = null;

// Check if user is logged in (you'll need to replace this with your actual auth check)
function checkAuthState() {
    // This is a placeholder - replace with your actual authentication check
    // For example, you might check for a token in localStorage or make an API call
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        currentUser = JSON.parse(userData);
        updateNavigation(true);
    } else {
        updateNavigation(false);
    }
}

// Update navigation based on auth state
function updateNavigation(isLoggedIn) {
    const navLinks = document.querySelectorAll('.nav-links');
    
    navLinks.forEach(nav => {
        // Clear existing navigation items except for Blog and Community
        const blogLink = nav.querySelector('a[href="blog.html"]');
        const communityLink = nav.querySelector('a[href="community.html"]');
        
        // Clear all nav items
        nav.innerHTML = '';
        
        // Add back Blog and Community links
        if (blogLink) nav.appendChild(blogLink);
        if (communityLink) nav.appendChild(communityLink);
        
        if (isLoggedIn && currentUser) {
            // Add user greeting and logout button
            const userGreeting = document.createElement('span');
            userGreeting.className = 'nav-user-greeting';
            userGreeting.textContent = `Hi, ${currentUser.name || 'User'}`;
            
            const logoutBtn = document.createElement('a');
            logoutBtn.href = '#';
            logoutBtn.className = 'btn btn-outline';
            logoutBtn.textContent = 'Logout';
            logoutBtn.onclick = handleLogout;
            
            nav.appendChild(userGreeting);
            nav.appendChild(logoutBtn);
        } else {
            // Add login and signup buttons
            const loginLink = document.createElement('a');
            loginLink.href = 'login.html';
            loginLink.textContent = 'Login';
            
            const signupLink = document.createElement('a');
            signupLink.href = 'signup.html';
            signupLink.className = 'btn btn-primary';
            signupLink.textContent = 'Sign Up';
            
            nav.appendChild(loginLink);
            nav.appendChild(signupLink);
        }
    });}

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    
    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    currentUser = null;
    
    // Update UI
    updateNavigation(false);
    
    // Redirect to home page
    if (window.location.pathname !== '/index.html') {
        window.location.href = 'index.html';
    }
}

// Initialize auth state when the page loads
document.addEventListener('DOMContentLoaded', checkAuthState);

// Export functions for use in other files
window.auth = {
    checkAuthState,
    updateNavigation,
    handleLogout,
    getCurrentUser: () => currentUser
};
