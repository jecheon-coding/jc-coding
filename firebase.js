import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, getDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBJOlnCec1Ns0Qhhwr7ZFEL4mxjA7_U5Xc",
    authDomain: "coding-play-9af36.firebaseapp.com",
    projectId: "coding-play-9af36",
    storageBucket: "coding-play-9af36.firebasestorage.app",
    messagingSenderId: "507936365305",
    appId: "1:507936365305:web:0f4c41be78b011efdde028"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 1. Event Listeners (Must be at the top for robustness) ---
document.addEventListener('DOMContentLoaded', () => {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const pw = document.getElementById('password').value;
            try {
                await signInWithEmailAndPassword(auth, email, pw);
                location.href = 'admin.html';
            } catch (error) {
                console.error("Login Error:", error);
                alert('로그인 실패: 아이디 또는 비밀번호를 확인해주세요.');
            }
        });
    }

    // Reservation Form
    const resForm = document.getElementById('reservationForm');
    if (resForm) {
        resForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const data = {
                    name: document.getElementById('name').value,
                    phone: document.getElementById('phone').value,
                    grade: document.getElementById('grade').value,
                    message: document.getElementById('message').value,
                    createdAt: serverTimestamp()
                };
                await addDoc(collection(db, "reservations"), data);
                
                // Formspree email
                const formData = new FormData(resForm);
                fetch("https://formspree.io/f/xeeppoza", {
                    method: "POST",
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                }).catch(err => console.error("Email send error:", err));

                alert('상담 신청이 완료되었습니다.');
                resForm.reset();
                document.getElementById('reservationModal').classList.remove('active');
                document.body.style.overflow = '';
            } catch (err) { alert('오류가 발생했습니다.'); }
        });
    }
});

// --- 2. Data Loading Functions (Wrapped in try-catch) ---
async function loadReviews() {
    const container = document.getElementById('reviewContainer');
    if (!container) return;
    try {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        container.innerHTML = '';
        if (snap.empty) {
            container.innerHTML = '<p style="text-align:center; padding:3rem 0; color:var(--text-muted);">등록된 후기가 없습니다.</p>';
            return;
        }
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            const card = document.createElement('div');
            card.className = 'review-card glass reveal active';
            card.innerHTML = `
                <div class="review-quote">"</div>
                <p style="white-space: pre-wrap;">${escapeHTML(data.content)}</p>
                <div class="reviewer">
                    <div class="reviewer-avatar">${(data.name || "익")[0]}</div>
                    <div class="reviewer-info">
                        <h4>${maskName(data.name || "익명")}</h4>
                        <span>${escapeHTML(data.grade || "")}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) { console.error("Review Loading Error:", e); }
}

async function loadSchedules() {
    const container = document.getElementById('scheduleContainer');
    if (!container) return;
    try {
        const q = query(collection(db, "schedules"), orderBy("order", "asc"));
        const snap = await getDocs(q);
        container.innerHTML = '';
        snap.forEach(docSnap => {
            const data = docSnap.data();
            let statusColor = data.status === '마감 임박' ? '#ef4444' : (data.status === '모집 중' ? '#22c55e' : '#3b82f6');
            container.innerHTML += `
                <tr>
                    <td>${escapeHTML(data.category)}</td>
                    <td>${escapeHTML(data.grade)}</td>
                    <td>${escapeHTML(data.course)}</td>
                    <td>${escapeHTML(data.time)}</td>
                    <td><span class="tag-active" style="color:${statusColor}">${escapeHTML(data.status)}</span></td>
                </tr>
            `;
        });
    } catch (e) { console.error("Schedule Loading Error:", e); }
}

// --- Utils ---
function maskName(name) {
    if (!name || name.length <= 1) return name;
    return name[0] + "*" + (name.length > 2 ? name[name.length-1] : "");
}
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag]));
}

// Auth State Check
onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.includes('login.html')) {
        location.href = 'admin.html';
    }
});

// Run
loadReviews();
loadSchedules();
