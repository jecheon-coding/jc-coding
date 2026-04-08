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

// --- 1. Event Listeners & Auth State ---
document.addEventListener('DOMContentLoaded', () => {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
                location.href = 'admin.html';
            } catch (err) { alert('로그인 실패: 정보를 확인해주세요.'); }
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            if(confirm('로그아웃 하시겠습니까?')) {
                await signOut(auth);
                location.href = 'login.html';
            }
        };
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
                // Notification (Optional)
                const formData = new FormData(resForm);
                fetch("https://formspree.io/f/xeeppoza", { method: "POST", body: formData, headers: {'Accept': 'application/json'} });
                
                alert('상담 신청 완료!');
                resForm.reset();
                document.getElementById('reservationModal').classList.remove('active');
            } catch (err) { alert('오류 발생'); }
        });
    }
});

// Auth Persistence & Admin Data Loading
onAuthStateChanged(auth, (user) => {
    if (user) {
        const path = window.location.pathname;
        if (path.includes('login.html')) location.href = 'admin.html';
        if (path.includes('admin.html')) loadAdminData();
    } else {
        if (window.location.pathname.includes('admin.html')) location.href = 'login.html';
    }
});

// --- 2. Admin Logic Functions ---
async function loadAdminData() {
    loadAdminReviews();
    loadAdminSchedules();
    loadAdminInquiries();
    loadStats();
}

async function loadAdminReviews() {
    const list = document.getElementById('adminReviewList');
    if (!list) return;
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = '';
    snap.forEach(docSnap => {
        const d = docSnap.data();
        const id = docSnap.id;
        const div = document.createElement('div');
        div.className = 'admin-item glass';
        div.style.padding = '1rem';
        div.style.marginBottom = '10px';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.innerHTML = `<div><strong>${escapeHTML(d.name)}</strong><p>${escapeHTML(d.content)}</p></div><button class="tab-btn" style="background:#ef4444; border:none;" onclick="deleteItem('reviews', '${id}')">삭제</button>`;
        list.appendChild(div);
    });
}

async function loadAdminInquiries() {
    const table = document.getElementById('inquiryTableBody');
    if (!table) return;
    const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    table.innerHTML = '';
    snap.forEach(docSnap => {
        const d = docSnap.data();
        const date = d.createdAt ? d.createdAt.toDate().toLocaleString() : '-';
        table.innerHTML += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:10px;">${date}</td><td style="padding:10px;">${escapeHTML(d.name)}</td><td style="padding:10px;">${escapeHTML(d.phone)}</td><td style="padding:10px;">${escapeHTML(d.grade)}</td><td style="padding:10px;">${escapeHTML(d.message)}</td></tr>`;
    });
}

async function loadAdminSchedules() {
    const list = document.getElementById('adminScheduleList');
    if (!list) return;
    const q = query(collection(db, "schedules"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    list.innerHTML = '';
    snap.forEach(docSnap => {
        const d = docSnap.data();
        const div = document.createElement('div');
        div.className = 'admin-item glass';
        div.style.padding = '1rem'; div.style.marginBottom = '10px';
        div.innerHTML = `<strong>${escapeHTML(d.category)}</strong> - ${escapeHTML(d.course)} (${escapeHTML(d.status)})`;
        list.appendChild(div);
    });
}

window.deleteItem = async (col, id) => {
    if(confirm('정말 삭제하시겠습니까?')) {
        await deleteDoc(doc(db, col, id));
        loadAdminData();
    }
};

// --- 3. Public Data Loading ---
async function loadReviews() {
    const container = document.getElementById('reviewContainer');
    if (!container) return;
    try {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        container.innerHTML = '';
        snap.forEach(docSnap => {
            const data = docSnap.data();
            container.innerHTML += `<div class="review-card glass reveal active"><p>${escapeHTML(data.content)}</p><h4>${escapeHTML(data.name)}</h4></div>`;
        });
    } catch (e) {}
}

async function loadSchedules() {
    const container = document.getElementById('scheduleContainer');
    if (!container) return;
    try {
        const q = query(collection(db, "schedules"), orderBy("order", "asc"));
        const snap = await getDocs(q);
        container.innerHTML = '';
        snap.forEach(docSnap => {
            const d = docSnap.data();
            container.innerHTML += `<tr><td>${escapeHTML(d.category)}</td><td>${escapeHTML(d.grade)}</td><td>${escapeHTML(d.course)}</td><td>${escapeHTML(d.time)}</td><td>${escapeHTML(d.status)}</td></tr>`;
        });
    } catch (e) {}
}

async function loadStats() {
    try {
        const totalSnap = await getDoc(doc(db, "stats", "visitor_info"));
        if (totalSnap.exists() && document.getElementById('totalVisits')) {
            document.getElementById('totalVisits').innerText = totalSnap.data().total.toLocaleString();
        }
    } catch (e) {}
}

// --- Utils ---
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag]));
}

// Track Visit
async function trackVisit() {
    if (sessionStorage.getItem('v')) return;
    try {
        const today = new Date().toISOString().split('T')[0];
        await updateDoc(doc(db, "stats", "visitor_info"), { total: increment(1) });
        await setDoc(doc(db, "daily_visits", today), { count: increment(1) }, { merge: true });
        sessionStorage.setItem('v', '1');
    } catch (e) {}
}

trackVisit();
loadReviews();
loadSchedules();
