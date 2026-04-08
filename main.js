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
            // ?†ÎãàÎ©îÏù¥?òÏ? ??Î≤àÎßå ?§Ìñâ?òÍ≥†, Î∞òÎ≥µ???êÏπò ?äÏúºÎ©?unobserve
            // observer.unobserve(entry.target); 
        } else {
            // ?¨ÎùºÏ°åÎã§Í∞Ä ?§Ïãú ?§ÌÅ¨Î°§Ïãú ?òÌ??òÍ≤å ?òÎ†§Î©?            entry.target.classList.remove('active');
        }
    });
};

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15 // ?îÏÜåÍ∞Ä 15% Î≥¥Ïùº ???§Ìñâ
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
        // ?ÑÏù¥ÏΩ?Î≥ÄÍ≤?(?ºÏÑ† <-> X)
        const icon = menuToggle.querySelector('i');
        if (navLinksContainer.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Î©îÎâ¥ ??™© ?¥Î¶≠ ??Î©îÎâ¥ ?´Í∏∞ Î∞?Î∂Ä?úÎü¨???òÏù¥ÏßÄ ?¥Îèô Ï≤òÎ¶¨
    navLinksItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            const isRecruitment = window.location.pathname.endsWith('recruitment.html');
            
            // ?ÑÏû¨ Î™®Ïßë?àÎÇ¥ ?òÏù¥ÏßÄ?êÏÑú 'Î™®Ïßë?àÎÇ¥'Î•??§Ïãú ?¥Î¶≠??Í≤ΩÏö∞ ?àÎ°úÍ≥†Ïπ® Î∞©Ï? (ÏµúÏÉÅ???§ÌÅ¨Î°?
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

            // ?∏Î? ?òÏù¥ÏßÄÎ°??¥Îèô?òÎäî Í≤ΩÏö∞ (index.html, recruitment.html ?? - ?†ÎãàÎ©îÏù¥?????¥Îèô
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
                // Î©îÎâ¥Í∞Ä ?´Ìûà???†ÎãàÎ©îÏù¥?òÏùÑ Î≥¥Ïó¨Ï§Ä ??300ms ???òÏù¥ÏßÄ ?¥Îèô
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
                return;
            }

            // Í∑????¥Ïãú ÎßÅÌÅ¨ ?¥Îèô ??(Í∏∞Ï°¥ ?ôÏûë)
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
// ?ÑÏó≠?ÅÏúºÎ°??ëÎèô?òÎèÑÎ°?Î™®Îã¨ Ï≤¥ÌÅ¨ ?∏Î?Î°??ÖÎ¶Ω ?úÌÇ¥
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

                    // ?§ÌÅ¨Î°§Ïù¥ ?ùÎÇ† Ï¶àÏùå Ï£ºÏÜåÏ∞ΩÏùò ?¥Ïãú(#) ?úÍ±∞
                    setTimeout(() => {
                        window.history.replaceState(null, null, window.location.pathname);
                    }, 800);
                }
            }
        });
    });

    // ?òÏù¥ÏßÄ Î°úÎìú ?úÏóê??Ï£ºÏÜåÏ∞ΩÏóê ?¥ÏãúÍ∞Ä ?àÏúºÎ©??úÍ±∞
    if (window.location.hash) {
        setTimeout(() => {
            window.history.replaceState(null, null, window.location.pathname);
        }, 1000);
    }
});

