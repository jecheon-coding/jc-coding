// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Scroll Reveal Animation (Intersection Observer)
const revealElements = document.querySelectorAll('.reveal');

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // 애니메이션은 한 번만 실행하고, 반복을 원치 않으면 unobserve
            // observer.unobserve(entry.target); 
        } else {
            // 사라졌다가 다시 스크롤시 나타나게 하려면
            entry.target.classList.remove('active');
        }
    });
};

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15 // 요소가 15% 보일 때 실행
};

const observer = new IntersectionObserver(revealCallback, observerOptions);

revealElements.forEach(el => {
    observer.observe(el);
});

// Reservation Modal Logic
const modal = document.getElementById('reservationModal');
const openModalBtns = document.querySelectorAll('.btn-reservation');
const closeModal = document.getElementById('closeModal');
const reservationForm = document.getElementById('reservationForm');

if (modal && openModalBtns.length > 0) {
    // Open modal
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// --- Mobile Menu Toggle Logic ---
const menuToggle = document.getElementById('menuToggle');
const navLinksContainer = document.querySelector('.nav-links');
const navLinksItems = document.querySelectorAll('.nav-links a');

if (menuToggle && navLinksContainer) {
    menuToggle.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
        // 아이콘 변경 (삼선 <-> X)
        const icon = menuToggle.querySelector('i');
        if (navLinksContainer.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // 메뉴 항목 클릭 시 메뉴 닫기 및 부드러운 페이지 이동 처리
    navLinksItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            const isRecruitment = window.location.pathname.endsWith('recruitment.html');
            
            // 현재 모집안내 페이지에서 '모집안내'를 다시 클릭한 경우 새로고침 방지 (최상단 스크롤)
            if (isRecruitment && href === 'recruitment.html') {
                e.preventDefault();
                navLinksContainer.classList.remove('active');
                if (menuToggle) {
                    const icon = menuToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // 외부 페이지로 이동하는 경우 (index.html, recruitment.html 등) - 애니메이션 후 이동
            if (href && !href.startsWith('#') && !href.startsWith('index.html#')) {
                e.preventDefault();
                navLinksContainer.classList.remove('active');
                if (menuToggle) {
                    const icon = menuToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
                // 메뉴가 닫히는 애니메이션을 보여준 뒤 300ms 후 페이지 이동
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
                return;
            }

            // 그 외 해시 링크 이동 시 (기존 동작)
            navLinksContainer.classList.remove('active');
            if (menuToggle) {
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    });
}

// --- Clean URL & Hash Removal Logic ---
// 전역적으로 작동하도록 모달 체크 외부로 독립 시킴
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-links a, .logo');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && (href.startsWith('index.html#') || href.startsWith('#'))) {
                const parts = href.split('#');
                const targetId = parts[1] || 'home';
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // 스크롤이 끝날 즈음 주소창의 해시(#) 제거
                    setTimeout(() => {
                        window.history.replaceState(null, null, window.location.pathname);
                    }, 800);
                }
            }
        });
    });

    // 페이지 로드 시에도 주소창에 해시가 있으면 제거
    if (window.location.hash) {
        setTimeout(() => {
            window.history.replaceState(null, null, window.location.pathname);
        }, 1000);
    }
});
