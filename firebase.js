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
    // Admin Login / Logout
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
                // Notification via Formspree
                const formData = new FormData(resForm);
                fetch("https://formspree.io/f/xeeppoza", { method: "POST", body: formData, headers: {'Accept': 'application/json'} });
                alert('상담 신청 완료!');
                resForm.reset();
                if(document.getElementById('reservationModal')) document.getElementById('reservationModal').classList.remove('active');
            } catch (err) { alert('오류 발생'); }
        });
    }

    // Public Review Form
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const data = {
                    name: document.getElementById('reviewName').value,
                    grade: document.getElementById('reviewGrade').value,
                    content: document.getElementById('reviewContent').value,
                    password: document.getElementById('reviewPassword').value,
                    createdAt: serverTimestamp()
                };
                await addDoc(collection(db, "reviews"), data);
                alert('후기가 등록되었습니다.');
                reviewForm.reset();
                if(document.getElementById('reviewModal')) document.getElementById('reviewModal').classList.remove('active');
                document.body.style.overflow = '';
                loadReviews();
            } catch (err) { alert('오류 발생'); }
        });
    }
});

// --- 2. Auth State ---
onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    if (user) {
        if (path.includes('login')) location.href = 'admin.html';
        if (path.includes('admin')) loadAdminData();
    } else {
        if (path.includes('admin')) location.href = 'login.html';
    }
});

// --- 3. Management (Admin Lists) ---
async function loadAdminData() {
    loadAdminStats();
    loadAdminReviews();
    loadAdminSchedules();
    loadAdminInquiries();
}

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
        
        // Chart Load
        const q = query(collection(db, "daily_visits"), orderBy("__name__", "desc"), limit(7));
        const snap = await getDocs(q);
        const dataMap = {};
        snap.forEach(d => dataMap[d.id] = d.data().count);
        const labels = [], counts = [];
        for(let i=6; i>=0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const s = d.toISOString().split('T')[0];
            labels.push(s.slice(5)); counts.push(dataMap[s] || 0);
        }
        renderChart(labels, counts);
    } catch (e) {}
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
                label: '일일 방문자', data: counts, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.4, fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.02)' } } } }
    });
}

async function loadAdminReviews() {
    const list = document.getElementById('adminReviewList');
    if (!list) return;
    const snap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")));
    list.innerHTML = '';
    snap.forEach(d => {
        const data = d.data();
        const id = d.id;
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `<div><strong>${escapeHTML(data.name)}</strong><p>${escapeHTML(data.content)}</p></div><button class="delete-btn" onclick="adminDeleteItem('reviews', '${id}')">삭제</button>`;
        list.appendChild(div);
    });
}

async function loadAdminInquiries() {
    const table = document.getElementById('inquiryTableBody');
    if (!table) return;
    const snap = await getDocs(query(collection(db, "reservations"), orderBy("createdAt", "desc")));
    table.innerHTML = '';
    snap.forEach(d => {
        const data = d.data();
        const date = data.createdAt ? data.createdAt.toDate().toLocaleString() : '-';
        table.innerHTML += `<tr style="border-bottom:1px solid rgba(255,255,255,0.03);"><td style="padding:20px;">${date}</td><td style="padding:20px;"><strong>${escapeHTML(data.name)}</strong></td><td style="padding:20px;">${escapeHTML(data.phone)}</td><td style="padding:20px;">${escapeHTML(data.grade)}</td><td style="padding:20px; max-width:300px;">${escapeHTML(data.message)}</td></tr>`;
    });
}

async function loadAdminSchedules() {
    const list = document.getElementById('adminScheduleList');
    if (!list) return;
    const snap = await getDocs(query(collection(db, "schedules"), orderBy("order", "asc")));
    list.innerHTML = '';
    snap.forEach(d => {
        const data = d.data();
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `<div><strong>${escapeHTML(data.course)}</strong><p style="color:#777;">${escapeHTML(data.category)}</p></div><div class="btn-group"><button class="edit-btn">수정</button><button class="delete-btn" onclick="adminDeleteItem('schedules', '${d.id}')">삭제</button></div>`;
        list.appendChild(div);
    });
}

window.adminDeleteItem = async (col, id) => { if(confirm('정말 삭제하시겠습니까?')) { await deleteDoc(doc(db, col, id)); loadAdminData(); } };

// --- 4. Public Site Support ---
async function loadReviews() {
    const container = document.getElementById('reviewContainer');
    if (!container) return;
    try {
        const snap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")));
        container.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const card = document.createElement('div');
            card.className = 'review-card glass reveal active';
            card.innerHTML = `
                <div class="review-quote">"</div>
                <div class="review-menu-btn" onclick="toggleReviewMenu('${id}')">⋮</div>
                <div id="menu-${id}" class="review-dropdown">
                    <button onclick="handleReviewAction('${id}', 'edit')">수정</button>
                    <button onclick="handleReviewAction('${id}', 'delete')">삭제</button>
                </div>
                <p style="white-space:pre-wrap;">${escapeHTML(data.content)}</p>
                <div class="reviewer">
                    <div class="reviewer-avatar">${(data.name||"익")[0]}</div>
                    <div class="reviewer-info">
                        <h4>${maskName(data.name || "익명")}</h4>
                        <span>${escapeHTML(data.grade || "")}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {}
}

window.toggleReviewMenu = (id) => {
    document.querySelectorAll('.review-dropdown').forEach(m => { if(m.id !== `menu-${id}`) m.classList.remove('active'); });
    document.getElementById(`menu-${id}`).classList.toggle('active');
};

window.handleReviewAction = async (id, action) => {
    const password = prompt('후기 등록 시 입력했던 비밀번호를 입력해 주세요.');
    if (!password) return;
    const docRef = doc(db, "reviews", id);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().password === password) {
        if (action === 'delete') { if(confirm('정말 삭제하시겠습니까?')) { await deleteDoc(docRef); alert('삭제되었습니다.'); loadReviews(); } }
        else if (action === 'edit') {
            const newContent = prompt('수정할 내용을 입력하세요.', snap.data().content);
            if (newContent) { await updateDoc(docRef, { content: newContent }); alert('수정되었습니다.'); loadReviews(); }
        }
    } else { alert('비밀번호가 일치하지 않습니다.'); }
};

window.addEventListener('click', (e) => { if(!e.target.classList.contains('review-menu-btn')) document.querySelectorAll('.review-dropdown').forEach(m => m.classList.remove('active')); });

// --- Utils ---
async function trackVisit() {
    if (sessionStorage.getItem('v')) return;
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        await updateDoc(doc(db, "stats", "visitor_info"), { total: increment(1) });
        await setDoc(doc(db, "daily_visits", todayStr), { count: increment(1) }, { merge: true });
        sessionStorage.setItem('v', '1');
    } catch (e) {}
}

async function loadSchedules() {
    const container = document.getElementById('scheduleContainer');
    if (!container) return;
    try {
        const snap = await getDocs(query(collection(db, "schedules"), orderBy("order", "asc")));
        container.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            let color = data.status === '마감 임박' ? '#ef4444' : (data.status === '모집 중' ? '#22c55e' : '#3b82f6');
            container.innerHTML += `<tr><td>${escapeHTML(data.category)}</td><td>${escapeHTML(data.grade)}</td><td>${escapeHTML(data.course)}</td><td>${escapeHTML(data.time)}</td><td><span class="tag-active" style="color:${color}">${escapeHTML(data.status)}</span></td></tr>`;
        });
    } catch (e) {}
}

function maskName(n) { if(!n || n.length<=1) return n; return n[0]+"*"+(n.length>2?n[n.length-1]:""); }
function escapeHTML(str) { if(!str) return ''; return str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t])); }

trackVisit();
loadReviews();
loadSchedules();
