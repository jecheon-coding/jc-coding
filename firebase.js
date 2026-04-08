import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, getDoc, increment, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

// --- 1. Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Admin Login
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

    // Admin Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            if(confirm('로그아웃 하시겠습니까?')) {
                await signOut(auth);
                location.href = 'login.html';
            }
        };
    }

    // Public Consultation Form
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
                // Email notification via Formspree
                const formData = new FormData(resForm);
                fetch("https://formspree.io/f/xeeppoza", { method: "POST", body: formData, headers: {'Accept': 'application/json'} });
                
                alert('상담 신청이 완료되었습니다.');
                resForm.reset();
                if(document.getElementById('reservationModal')) document.getElementById('reservationModal').classList.remove('active');
            } catch (err) { alert('오류가 발생했습니다.'); }
        });
    }
});

// --- 2. Auth State & Admin Data ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (window.location.pathname.includes('login.html')) location.href = 'admin.html';
        if (window.location.pathname.includes('admin.html')) loadAdminData();
    } else {
        if (window.location.pathname.includes('admin.html')) location.href = 'login.html';
    }
});

async function loadAdminData() {
    loadAdminStats();
    loadAdminReviews();
    loadAdminSchedules();
    loadAdminInquiries();
}

// Full Stats Logic with Chart
let visitsChart = null;
async function loadAdminStats() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const totalSnap = await getDoc(doc(db, "stats", "visitor_info"));
        const todaySnap = await getDoc(doc(db, "daily_visits", todayStr));
        const yesterdaySnap = await getDoc(doc(db, "daily_visits", yesterdayStr));

        if (document.getElementById('totalVisits')) document.getElementById('totalVisits').innerText = totalSnap.exists() ? totalSnap.data().total.toLocaleString() : '0';
        if (document.getElementById('todayVisits')) document.getElementById('todayVisits').innerText = todaySnap.exists() ? todaySnap.data().count.toLocaleString() : '0';
        if (document.getElementById('yesterdayVisits')) document.getElementById('yesterdayVisits').innerText = yesterdaySnap.exists() ? yesterdaySnap.data().count.toLocaleString() : '0';

        // Load last 7 days for chart
        const q = query(collection(db, "daily_visits"), orderBy("__name__", "desc"), limit(7));
        const snap = await getDocs(q);
        const dataMap = {};
        snap.forEach(d => dataMap[d.id] = d.data().count);

        const labels = [], counts = [];
        for(let i=6; i>=0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const s = d.toISOString().split('T')[0];
            labels.push(s.slice(5)); // MM-DD
            counts.push(dataMap[s] || 0);
        }
        renderChart(labels, counts);
    } catch (e) { console.error("Stats Error:", e); }
}

function renderChart(labels, counts) {
    const ctx = document.getElementById('visitsChart');
    if (!ctx) return;
    if (visitsChart) visitsChart.destroy();
    visitsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '일일 방문자',
                data: counts,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
        }
    });
}

// --- 3. Management Logic ---
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
        div.style.padding = '1.5rem'; div.style.marginBottom = '1rem'; div.style.display = 'flex'; div.style.justifyContent = 'space-between'; div.style.alignItems='center';
        div.innerHTML = `<div><strong style="font-size:1.1rem;">${escapeHTML(d.name)}</strong><p style="margin-top:5px; color:#ccc;">${escapeHTML(d.content)}</p></div><button class="tab-btn" style="background:#ef4444; border:none; padding: 0.5rem 1rem;" onclick="deleteItem('reviews', '${id}')">삭제</button>`;
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
        table.innerHTML += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'"><td style="padding:15px;">${date}</td><td style="padding:15px;"><strong>${escapeHTML(d.name)}</strong></td><td style="padding:15px; color:var(--primary);">${escapeHTML(d.phone)}</td><td style="padding:15px;">${escapeHTML(d.grade)}</td><td style="padding:15px; max-width:300px;">${escapeHTML(d.message)}</td></tr>`;
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
        div.style.padding = '1rem'; div.style.marginBottom = '1rem';
        div.innerHTML = `<span class="section-tag" style="padding: 2px 8px; font-size: 0.8rem; margin-bottom: 5px;">${escapeHTML(d.category)}</span><p><strong>${escapeHTML(d.course)}</strong> - ${escapeHTML(d.status)}</p>`;
        list.appendChild(div);
    });
}

window.deleteItem = async (col, id) => { if(confirm('말 삭제하시겠습니까?')) { await deleteDoc(doc(db, col, id)); loadAdminData(); } };

// --- 4. Public Site Support ---
async function loadReviews() {
    const container = document.getElementById('reviewContainer');
    if (!container) return;
    try {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        container.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            container.innerHTML += `<div class="review-card glass reveal active"><div class="review-quote">"</div><p style="white-space:pre-wrap;">${escapeHTML(data.content)}</p><div class="reviewer"><div class="reviewer-avatar">${(data.name||"익")[0]}</div><div class="reviewer-info"><h4>${maskName(data.name || "익명")}</h4><span>${escapeHTML(data.grade || "")}</span></div></div></div>`;
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
        snap.forEach(d => {
            const data = d.data();
            let color = data.status === '마감 임박' ? '#ef4444' : (data.status === '모집 중' ? '#22c55e' : '#3b82f6');
            container.innerHTML += `<tr><td>${escapeHTML(data.category)}</td><td>${escapeHTML(data.grade)}</td><td>${escapeHTML(data.course)}</td><td>${escapeHTML(data.time)}</td><td><span class="tag-active" style="color:${color}">${escapeHTML(data.status)}</span></td></tr>`;
        });
    } catch (e) {}
}

async function trackVisit() {
    if (sessionStorage.getItem('v')) return;
    try {
        const today = new Date().toISOString().split('T')[0];
        await updateDoc(doc(db, "stats", "visitor_info"), { total: increment(1) });
        await setDoc(doc(db, "daily_visits", today), { count: increment(1) }, { merge: true });
        sessionStorage.setItem('v', '1');
    } catch (e) {}
}

// Helper Utils
function maskName(n) { if(!n || n.length<=1) return n; return n[0]+"*"+(n.length>2?n[n.length-1]:""); }
function escapeHTML(str) { if(!str) return ''; return str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t])); }

// Run Initial Functions
trackVisit();
loadReviews();
loadSchedules();
