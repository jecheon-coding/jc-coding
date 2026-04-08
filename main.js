document.addEventListener('DOMContentLoaded', () => {
    // 1. Smooth Scrolling (Better catch for index.html#about)
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const url = new URL(this.href);
            
            // 현재 페이지 내의 앵커인 경우
            if (url.pathname === window.location.pathname || url.pathname === '/' + window.location.pathname.split('/').pop()) {
                const targetId = href.split('#')[1];
                if (targetId) {
                    const target = document.getElementById(targetId);
                    if (target) {
                        e.preventDefault();
                        window.scrollTo({
                            top: target.offsetTop - 80,
                            behavior: 'smooth'
                        });
                        // URL에 #이 남지 않도록 히스토리 정리 (선택 사항)
                        // history.pushState(null, null, window.location.pathname);
                        
                        // Close mobile menu
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

    // 2. Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // 3. Header Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 4. Reveal Animations
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // 5. Modal Logic (Consultation & Reviews)
    
    // --- Consultation Modal ---
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

    // --- Review Modal ---
    const revModal = document.getElementById('reviewModal');
    const openRevBtn = document.getElementById('openReviewBtn');
    const closeRevBtn = document.getElementById('closeReviewBtn');

    if (revModal && openRevBtn) {
        openRevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            revModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    if (closeRevBtn) {
        closeRevBtn.addEventListener('click', () => {
            revModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Modal background close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});
