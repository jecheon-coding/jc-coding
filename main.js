document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Load Check (Remove # if coming from other page)
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        const target = document.getElementById(targetId);
        if (target) {
            // Wait slightly for layout to settle, then scroll smoothly
            setTimeout(() => {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
                // Remove hash from URL without reloading
                if (window.history.replaceState) {
                    window.history.replaceState(null, null, window.location.pathname);
                }
            }, 300);
        }
    }

    // 2. Smooth Scrolling (Click event)
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const url = new URL(this.href, window.location.origin);
            
            // Normalize paths: remove .html and trailing slashes for comparison
            const currentPath = window.location.pathname.replace('.html', '').replace(/\/$/, '') || '/';
            const targetPath = url.pathname.replace('.html', '').replace(/\/$/, '') || '/';

            // If it's the same page or we are going to index (root)
            if (currentPath === targetPath || (targetPath === '/' && currentPath === '/index')) {
                const targetId = href.split('#')[1];
                if (targetId) {
                    const target = document.getElementById(targetId);
                    if (target) {
                        e.preventDefault();
                        window.scrollTo({
                            top: target.offsetTop - 80,
                            behavior: 'smooth'
                        });
                        
                        // Keep URL clean
                        if (window.history.pushState) {
                            window.history.pushState(null, null, targetPath === '/index' ? '/' : url.pathname);
                        }
                        
                        // Toggle mobile menu if open
                        const navLinks = document.querySelector('.nav-links');
                        const menuToggle = document.getElementById('menuToggle');
                        if (navLinks && navLinks.classList.contains('active')) {
                            navLinks.classList.remove('active');
                            if(menuToggle) menuToggle.classList.remove('active');
                        }
                    }
                }
            }
        });
    });

    // 3. Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // 4. Header Scroll Effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });
    }

    // 5. Reveal Animations
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, observerOptions);
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // 6. Modal Logic (Consultation)
    const resModal = document.getElementById('reservationModal');
    const openResBtns = document.querySelectorAll('.btn-reservation');
    const closeResBtn = document.getElementById('closeModal');

    if (resModal && openResBtns.length > 0) {
        openResBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                resModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });
    }
    if (closeResBtn) {
        closeResBtn.addEventListener('click', () => {
            resModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});
