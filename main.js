document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Load Check (Remove # if coming from other page)
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        const target = document.getElementById(targetId);
        if (target) {
            setTimeout(() => {
                window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
                if (window.history.replaceState) window.history.replaceState(null, null, window.location.pathname);
            }, 300);
        }
    }

    // 2. Smooth Scrolling & URL Cleanup
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const url = new URL(this.href, window.location.origin);
            const currentPath = window.location.pathname.replace('.html', '').replace(/\/$/, '') || '/';
            const targetPath = url.pathname.replace('.html', '').replace(/\/$/, '') || '/';

            if (currentPath === targetPath || (targetPath === '/' && currentPath === '/index')) {
                const targetId = href.split('#')[1];
                if (targetId) {
                    const target = document.getElementById(targetId);
                    if (target) {
                        e.preventDefault();
                        window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
                        if (window.history.pushState) window.history.pushState(null, null, targetPath === '/index' ? '/' : url.pathname);
                        document.querySelector('.nav-links')?.classList.remove('active');
                        document.getElementById('menuToggle')?.classList.remove('active');
                    }
                }
            }
        });
    });

    // 3. Modal Logic (Restored & Specialized)
    const setupModal = (modalId, openBtnClass) => {
        const modal = document.getElementById(modalId);
        const btns = document.querySelectorAll(openBtnClass);
        if (!modal) return;
        btns.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            };
        });
        // Close on click outside or close buttons
        modal.onclick = (e) => { if(e.target === modal) closeModal(modalId); };
    };

    window.closeModal = (id) => {
        const m = document.getElementById(id);
        if(m) {
            m.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Initialize all modals
    setupModal('reservationModal', '.btn-reservation');
    setupModal('reviewModal', '.btn-review'); // Add btn-review class to review buttons

    document.getElementById('closeModal')?.addEventListener('click', () => closeModal('reservationModal'));
    document.getElementById('closeReviewModal')?.addEventListener('click', () => closeModal('reviewModal'));

    // 4. Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // 5. Header Scroll Effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });
    }

    // 6. Reveal Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});
