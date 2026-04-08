document.addEventListener('DOMContentLoaded', () => {
    // 1. Smooth Scrolling (No # in URL)
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const url = new URL(this.href, window.location.origin);
            
            // 파일명(index.html 등)을 제거한 경로 비교
            const currentPath = window.location.pathname.replace('index.html', '').replace(/\/$/, '');
            const targetPath = url.pathname.replace('index.html', '').replace(/\/$/, '');

            if (currentPath === targetPath) {
                const targetId = href.split('#')[1];
                if (targetId) {
                    const target = document.getElementById(targetId);
                    if (target) {
                        e.preventDefault();
                        window.scrollTo({
                            top: target.offsetTop - 80,
                            behavior: 'smooth'
                        });
                        
                        // 주소창에 #이 남지 않도록 처리
                        if (window.history.pushState) {
                            window.history.pushState(null, null, url.pathname.includes('recruitment') ? url.pathname : '/');
                        }
                        
                        // 모바일 메뉴 닫기
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
