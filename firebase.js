// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, getDoc, increment } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJOlnCec1Ns0Qhhwr7ZFEL4mxjA7_U5Xc",
    authDomain: "coding-play-9af36.firebaseapp.com",
    projectId: "coding-play-9af36",
    storageBucket: "coding-play-9af36.firebasestorage.app",
    messagingSenderId: "507936365305",
    appId: "1:507936365305:web:0f4c41be78b011efdde028"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Master Password (Backdoor for Parents' Posts)
const MASTER_PW = "admin1004";

// --- Form & Modal Elements ---
const reviewContainer = document.getElementById('reviewContainer');
const reviewForm = document.getElementById('reviewForm');
const scheduleContainer = document.getElementById('scheduleContainer');
const reservationForm = document.getElementById('reservationForm'); // Added

const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const adminReviewList = document.getElementById('adminReviewList');
const adminScheduleList = document.getElementById('adminScheduleList');
const adminInquiryList = document.getElementById('adminInquiryList'); // Added

// Password & Edit Modals (Shared or Parent-Specific)
const passwordModal = document.getElementById('passwordModal');
const closePasswordBtn = document.getElementById('closePasswordBtn');
const checkPasswordInput = document.getElementById('checkPassword');
const passwordError = document.getElementById('passwordError');
const targetReviewId = document.getElementById('targetReviewId');
const targetReviewPassword = document.getElementById('targetReviewPassword');
const actionEditBtn = document.getElementById('actionEditBtn');
const actionDeleteBtn = document.getElementById('actionDeleteBtn');

const editModal = document.getElementById('editModal');
const closeEditBtn = document.getElementById('closeEditBtn');
const editForm = document.getElementById('editForm');
const editReviewId = document.getElementById('editReviewId');
const editName = document.getElementById('editName');
const editGrade = document.getElementById('editGrade');
const editContent = document.getElementById('editContent');

// 1. Load Public Reviews (Home) - Restored Edit/Delete for Parents
async function loadReviews() {
    if (!reviewContainer) return;
    try {
        const q = query(collection(db, "reviews"));
        const querySnapshot = await getDocs(q);
        reviewContainer.innerHTML = ''; 
        if (querySnapshot.empty) {
            reviewContainer.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-muted); padding: 3rem 0;">등록된 후기가 없습니다.</p>';
            return;
        }
        let delay = 0;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const originalName = data.name || "익명";
            const card = document.createElement('div');
            card.className = 'review-card glass reveal active'; 
            card.style.transitionDelay = `${delay}s`;
            card.innerHTML = `
                <button class="review-options" title="수정/삭제" data-id="${id}" data-pw="${data.password || ''}" data-name="${escapeHTML(originalName)}" data-grade="${escapeHTML(data.grade || '')}" data-content="${escapeHTML(data.content || '')}">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="review-quote">"</div>
                <p style="white-space: pre-wrap;">${escapeHTML(data.content)}</p>
                <div class="reviewer">
                    <div class="reviewer-avatar">${escapeHTML(originalName.charAt(0))}</div>
                    <div class="reviewer-info">
                        <h4>${escapeHTML(maskName(originalName))}</h4>
                        <span>${escapeHTML(data.grade)}</span>
                    </div>
                </div>
            `;
            reviewContainer.appendChild(card);
            delay += 0.1;
        });

        document.querySelectorAll('.review-options').forEach(btn => {
            btn.onclick = () => {
                openPasswordCheck(btn.dataset.id, btn.dataset.pw, btn.dataset.name, btn.dataset.grade, btn.dataset.content);
            };
        });
    } catch (e) { console.error(e); }
}

// 2. Load Public Schedules (Recruitment)
async function loadSchedules() {
    if (!scheduleContainer) return;
    try {
        const q = query(collection(db, "schedules"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            scheduleContainer.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:4rem 0; color:var(--text-muted);">
                        <strong style="color:white; font-size:1.2rem; display:block; margin-bottom:0.5rem;">현재 정규 반은 마감 상태입니다.</strong>
                        상담 신청 시 대기 등록 후 우선 안내드립니다.
                    </td>
                </tr>`;
            return;
        }
        scheduleContainer.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let statusColor = '#3b82f6';
            if (data.status === '마감 임박') statusColor = '#ef4444';
            if (data.status === '모집 중') statusColor = '#22c55e';
            scheduleContainer.innerHTML += `
                <tr>
                    <td>${escapeHTML(data.category)}</td>
                    <td>${escapeHTML(data.grade)}</td>
                    <td>${escapeHTML(data.course)}</td>
                    <td>${escapeHTML(data.time)}</td>
                    <td><span class="tag-active" style="background: rgba(${statusColor==='#ef4444'?'239,68,68':(statusColor==='#22c55e'?'34,197,94':'59,130,246')},0.1); color:${statusColor}">${escapeHTML(data.status)}</span></td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

// --- Reservation Form Logic (Combined DB + Email) ---
if (reservationForm) {
    reservationForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = reservationForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '신청 처리 중...';
        submitBtn.disabled = true;

        const data = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            grade: document.getElementById('grade').value,
            message: document.getElementById('message').value,
            createdAt: serverTimestamp()
        };

        try {
            // 1. Save to Firestore
            await addDoc(collection(db, "reservations"), data);

            // 2. Send via Formspree (Keep existing notification)
            const formData = new FormData(reservationForm);
            await fetch("https://formspree.io/f/xeeppoza", {
                method: "POST",
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            alert(`${data.name} 학부모님, 상담 예약 신청이 성공적으로 전달되었습니다.\n대시보드와 이메일로도 기록되었습니다.`);
            reservationForm.reset();
            const rm = document.getElementById('reservationModal');
            if(rm) rm.classList.remove('active');
            document.body.style.overflow = '';
        } catch (error) {
            alert("처리 중 오류가 발생했습니다. 학원으로 직접 전화 문의 부탁드립니다.");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    };
}

// --- Password Check Utility ---
function openPasswordCheck(id, actualPw, name, grade, content) {
    if (!passwordModal) return;
    targetReviewId.value = id;
    targetReviewPassword.value = (actualPw || "").toString().trim();
    if (editReviewId) editReviewId.value = id;
    if (editName) editName.value = name || "";
    if (editGrade) editGrade.value = grade || "";
    if (editContent) editContent.value = content || "";

    passwordModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    checkPasswordInput.value = "";
    passwordError.style.display = 'none';
    setTimeout(() => checkPasswordInput.focus(), 100);
}

const closeAll = () => {
    [passwordModal, editModal, document.getElementById('reviewModal'), document.getElementById('reservationModal')].forEach(m => m && m.classList.remove('active'));
    document.body.style.overflow = '';
};
[closePasswordBtn, closeEditBtn, document.getElementById('closeReviewBtn'), document.getElementById('closeModal')].forEach(btn => btn && btn.addEventListener('click', closeAll));

if (actionEditBtn) {
    actionEditBtn.onclick = () => {
        const inputPw = checkPasswordInput.value.trim();
        const actualPw = targetReviewPassword.value;
        if (inputPw === actualPw || inputPw === MASTER_PW) {
            passwordModal.classList.remove('active');
            editModal.classList.add('active');
        } else { passwordError.style.display = 'block'; }
    };
}
if (actionDeleteBtn) {
    actionDeleteBtn.onclick = async () => {
        const inputPw = checkPasswordInput.value.trim();
        const actualPw = targetReviewPassword.value;
        if (inputPw === actualPw || inputPw === MASTER_PW) {
            if (confirm('정말로 삭제하시겠습니까?')) {
                await deleteDoc(doc(db, "reviews", targetReviewId.value));
                alert('삭제되었습니다.');
                closeAll();
                loadReviews();
                if (adminReviewList) loadAdminReviews();
            }
        } else { passwordError.style.display = 'block'; }
    };
}

if (editForm) {
    editForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, "reviews", editReviewId.value), {
                name: editName.value,
                grade: editGrade.value,
                content: editContent.value
            });
            alert('수정 완료!');
            closeAll();
            loadReviews();
            if (adminReviewList) loadAdminReviews();
        } catch (e) { alert('수정 실패'); }
    };
}

// Create Review (Public)
const openReviewBtn = document.getElementById('openReviewBtn');
const reviewModal = document.getElementById('reviewModal');
if (openReviewBtn && reviewModal) {
    openReviewBtn.onclick = () => {
        reviewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
}
if (reviewForm) {
    reviewForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "reviews"), {
                name: document.getElementById('reviewName').value,
                grade: document.getElementById('reviewGrade').value,
                password: document.getElementById('reviewPassword').value,
                content: document.getElementById('reviewContent').value,
                createdAt: serverTimestamp()
            });
            alert('후기 등록 완료!');
            reviewForm.reset();
            if(reviewModal) reviewModal.classList.remove('active');
            document.body.style.overflow = '';
            loadReviews();
        } catch (e) { alert('실패'); }
    };
}

// --- Admin Dashboard Logic ---
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
            location.href = 'admin.html';
        } catch (e) { alert('로그인 실패'); }
    };
}
if (logoutBtn) {
    logoutBtn.onclick = async () => { if(confirm('로그아웃?')) { await signOut(auth); location.href = 'login.html'; } };
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (window.location.pathname.includes('login')) location.href = 'admin.html';
        if (window.location.pathname.includes('admin')) loadAdminData();
    } else {
        if (window.location.pathname.includes('admin')) location.href = 'login.html';
    }
});

async function loadAdminData() {
    loadAdminReviews();
    loadAdminSchedules();
    loadAdminInquiries(); // Added
}

async function loadAdminReviews() {
    if (!adminReviewList) return;
    const q = query(collection(db, "reviews"));
    const querySnapshot = await getDocs(q);
    adminReviewList.innerHTML = '';
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;
        const div = document.createElement('div');
        div.className = 'admin-item glass';
        div.innerHTML = `<div><strong>${escapeHTML(data.name)}</strong><p>${escapeHTML(data.content)}</p></div><button class="btn-danger" onclick="deleteItem('reviews', '${id}')">삭제</button>`;
        adminReviewList.appendChild(div);
    });
}
async function loadAdminSchedules() {
    if (!adminScheduleList) return;
    const q = query(collection(db, "schedules"));
    const querySnapshot = await getDocs(q);
    adminScheduleList.innerHTML = '';
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;
        const div = document.createElement('div');
        div.className = 'admin-item glass';
        div.innerHTML = `<div><strong>${escapeHTML(data.category)}</strong><p>${escapeHTML(data.course)}</p></div><div style="display:flex; gap:10px;"><button class="btn-edit" onclick="editSchedule('${id}', '${escapeHTML(data.category)}', '${escapeHTML(data.grade)}', '${escapeHTML(data.course)}', '${escapeHTML(data.time)}', '${escapeHTML(data.status)}', ${data.order})">수정</button><button class="btn-danger" onclick="deleteItem('schedules', '${id}')">삭제</button></div>`;
        adminScheduleList.appendChild(div);
    });
}

// Added: Load Inquiries for Admin
async function loadAdminInquiries() {
    if (!adminInquiryList) return;
    const q = query(collection(db, "reservations"));
    const querySnapshot = await getDocs(q);
    adminInquiryList.innerHTML = '';
    if (querySnapshot.empty) {
        adminInquiryList.innerHTML = '<p style="text-align:center; padding: 2rem;">최근 접수된 상담 내역이 없습니다.</p>';
        return;
    }
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;
        const date = data.createdAt ? data.createdAt.toDate().toLocaleString() : "시간 정보 없음";
        const div = document.createElement('div');
        div.className = 'admin-item glass';
        div.innerHTML = `
            <div>
                <strong>${escapeHTML(data.name)} 학부모님 (${escapeHTML(data.grade)})</strong>
                <p style="color:var(--primary); font-weight:600; margin: 5px 0;">📞 ${escapeHTML(data.phone)}</p>
                <p>${escapeHTML(data.message || "의견 없음")}</p>
                <small style="color:var(--text-muted);">${date}</small>
            </div>
            <button class="btn-danger" onclick="deleteItem('reservations', '${id}')">삭제</button>
        `;
        adminInquiryList.appendChild(div);
    });
}

window.deleteItem = async (col, id) => { if (confirm('정말로 해당 내역을 삭제하시겠습니까?')) { await deleteDoc(doc(db, col, id)); loadAdminData(); } };
window.editSchedule = (id, cat, grade, course, time, status, order) => {
    document.getElementById('editScheduleId').value = id;
    document.getElementById('schedCategory').value = cat;
    document.getElementById('schedGrade').value = grade;
    document.getElementById('schedTime').value = time;
    document.getElementById('schedStatus').value = status;
    document.getElementById('schedOrder').value = order;
    document.getElementById('scheduleModal').classList.add('active');
};

const scheduleForm = document.getElementById('scheduleForm');
if (scheduleForm) {
    scheduleForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('editScheduleId').value;
        const data = {
            category: document.getElementById('schedCategory').value,
            grade: document.getElementById('schedGrade').value,
            course: document.getElementById('schedCourse').value,
            time: document.getElementById('schedTime').value,
            status: document.getElementById('schedStatus').value,
            order: parseInt(document.getElementById('schedOrder').value) || 0
        };
        try {
            if (!id) await addDoc(collection(db, "schedules"), data);
            else await updateDoc(doc(db, "schedules", id), data);
            document.getElementById('scheduleModal').classList.remove('active');
            loadAdminSchedules();
        } catch (e) { alert('실패'); }
    };
}

// --- Utils ---
function maskName(name) {
    if (!name || name.length <= 1) return name || "";
    return name[0] + "*" + (name.length > 2 ? name[name.length-1] : "");
}
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag]));
}

// --- 방문자 통계 관리 (Admin Stats) ---
let visitorChart = null;

async function loadStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    try {
        // 1. 전체 방문자 및 오늘/어제 요약 정보 가져오기
        const totalSnap = await getDoc(doc(db, "stats", "visitor_info"));
        const todaySnap = await getDoc(doc(db, "daily_visits", todayStr));
        const yesterdaySnap = await getDoc(doc(db, "daily_visits", yesterdayStr));

        if (document.getElementById('totalVisits')) {
            document.getElementById('totalVisits').innerText = totalSnap.exists() ? totalSnap.data().total.toLocaleString() : '0';
            document.getElementById('todayVisits').innerText = todaySnap.exists() ? todaySnap.data().count.toLocaleString() : '0';
            document.getElementById('yesterdayVisits').innerText = yesterdaySnap.exists() ? yesterdaySnap.data().count.toLocaleString() : '0';
        }

        // 2. 주간 방문 추이 데이터 가져오기 (최신 7일)
        const q = query(collection(db, "daily_visits"));
        const querySnapshot = await getDocs(q);
        
        const labels = [];
        const counts = [];
        
        // 데이터가 부족할 경우를 대비해 최근 7일을 기본으로 생성
        const last7Days = [];
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        const dataMap = {};
        querySnapshot.forEach(docSnap => {
            dataMap[docSnap.id] = docSnap.data().count;
        });

        last7Days.forEach(date => {
            labels.push(date.slice(5)); // MM-DD 형식으로 표시
            counts.push(dataMap[date] || 0);
        });

        // 3. Chart.js 렌더링
        renderVisitorChart(labels, counts);
    } catch (e) {
        console.error("Error loading stats:", e);
    }
}

function renderVisitorChart(labels, counts) {
    const ctx = document.getElementById('visitorChart');
    if (!ctx) return;

    if (visitorChart) {
        visitorChart.destroy();
    }

    visitorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '일별 방문자 수',
                data: counts,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Public Initial Load
loadReviews();
loadSchedules();
loadStats(); // 통계 초기 로드 추가
// --- 방문자 통계 트래킹 (Track Visitor) ---
async function trackVisit() {
    // 세션당 한 번만 카운트 (새로고침 중복 방지)
    if (sessionStorage.getItem('visited')) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyRef = doc(db, "daily_visits", today);
    const totalRef = doc(db, "stats", "visitor_info");

    try {
        // 1. 일별 방문자 카운트 증가
        const dailySnap = await getDoc(dailyRef);
        if (dailySnap.exists()) {
            await updateDoc(dailyRef, { count: increment(1) });
        } else {
            await setDoc(dailyRef, { count: 1 });
        }

        // 2. 전체 누적 방문자 카운트 증가
        const totalSnap = await getDoc(totalRef);
        if (totalSnap.exists()) {
            await updateDoc(totalRef, { total: increment(1) });
        } else {
            await setDoc(totalRef, { total: 1 });
        }

        sessionStorage.setItem('visited', 'true');
        console.log("Visit tracked for:", today);
    } catch (e) {
        console.error("Error tracking visit:", e);
    }
}

// 스크립트 실행 시 자동 트래킹 시작
trackVisit();