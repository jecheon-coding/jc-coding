import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, getDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const reservationForm = document.getElementById('reservationForm'); 

const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const adminReviewList = document.getElementById('adminReviewList');
const adminScheduleList = document.getElementById('adminScheduleList');
const adminInquiryList = document.getElementById('adminInquiryList'); 

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

// 1. Load Public Reviews (Home)
async function loadReviews() {
    if (!reviewContainer) return;
    try {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
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
        const q = query(collection(db, "schedules"), orderBy("order", "asc"));
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
            await addDoc(collection(db, "reservations"), data);
            const formData = new FormData(reservationForm);
            await fetch("https://formspree.io/f/xeeppoza", {
                method: "POST",
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            alert(`${data.name} 학부모님, 상담 예약 신청이 성공적으로 전달되었습니다.`);
            reservationForm.reset();
            const rm = document.getElementById('reservationModal');
            if(rm) rm.classList.remove('active');
            document.body.style.overflow = '';
        } catch (error) {
            alert("처리 중 오류가 발생했습니다.");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
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

// Public Initial Load
loadReviews();
loadSchedules();

// --- Auth Callback ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (window.location.pathname.includes('login.html')) location.href = 'admin.html';
        if (window.location.pathname.includes('admin.html')) loadAdminData();
    } else {
        if (window.location.pathname.includes('admin.html')) location.href = 'login.html';
    }
});

async function loadAdminData() {
    loadAdminReviews();
    loadAdminSchedules();
    loadAdminInquiries(); 
}

async function loadAdminReviews() {
    if (!adminReviewList) return;
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
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
    const q = query(collection(db, "schedules"), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    adminScheduleList.innerHTML = '';
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;
        const div = document.createElement('div');
        div.className = 'admin-item glass';
        div.innerHTML = `<div><strong>${escapeHTML(data.category)}</strong><p>${escapeHTML(data.course)}</p></div><div style="display:flex; gap:10px;"><button class="btn-edit" onclick="editSchedule('${id}')">수정</button><button class="btn-danger" onclick="deleteItem('schedules', '${id}')">삭제</button></div>`;
        adminScheduleList.appendChild(div);
    });
}

async function loadAdminInquiries() {
    if (!adminInquiryList) return;
    const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    adminInquiryList.innerHTML = '';
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;
        const div = document.createElement('div');
        div.className = 'admin-item glass';
        div.innerHTML = `<div><strong>${escapeHTML(data.name)} 학부모님</strong><p>📞 ${escapeHTML(data.phone)} / ${escapeHTML(data.grade)}</p><p>${escapeHTML(data.message)}</p></div><button class="btn-danger" onclick="deleteItem('reservations', '${id}')">삭제</button>`;
        adminInquiryList.appendChild(div);
    });
}

window.deleteItem = async (col, id) => { if (confirm('정말 삭제하시겠습니까?')) { await deleteDoc(doc(db, col, id)); loadAdminData(); } };
