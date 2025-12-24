// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }

    // Close mobile menu when clicking on a nav link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-container') && window.innerWidth <= 768) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
});
