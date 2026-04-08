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

// --- 전역 변수 (모달 제어용) ---
let currentTargetId = null;
let currentTargetData = null;

// --- 1. Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // 상담 신청 폼
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
                const formData = new FormData(resForm);
                fetch("https://formspree.io/f/xeeppoza", { method: "POST", body: formData, headers: {'Accept': 'application/json'} });
                alert('상담 신청이 완료되었습니다.');
                resForm.reset();
                if(window.closeModal) window.closeModal('reservationModal');
            } catch (err) { alert('오류 발생'); }
        });
    }

    // 후기 작성 폼
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
                alert('후기가 성공적으로 등록되었습니다.');
                reviewForm.reset();
                if(window.closeModal) window.closeModal('reviewModal');
                loadReviews();
            } catch (err) { alert('등록 실패'); }
        });
    }

    // 후기 수정 폼 제출
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editReviewId').value;
            try {
                await updateDoc(doc(db, "reviews", id), {
                    name: document.getElementById('editName').value,
                    grade: document.getElementById('editGrade').value,
                    content: document.getElementById('editContent').value
                });
                alert('수정되었습니다.');
                if(window.closeModal) window.closeModal('editModal');
                loadReviews();
            } catch (e) { alert('수정 실패'); }
        });
    }

    // 비밀번호 확인 모달 - 수정 버튼 클릭 시
    document.getElementById('actionEditBtn')?.addEventListener('click', () => {
        const inputPw = document.getElementById('checkPassword').value;
        if (inputPw === currentTargetData.password) {
            if(window.closeModal) window.closeModal('passwordModal');
            openEditModal(currentTargetId, currentTargetData);
        } else {
            showPasswordError();
        }
    });

    // 비밀번호 확인 모달 - 삭제 버튼 클릭 시
    document.getElementById('actionDeleteBtn')?.addEventListener('click', async () => {
        const inputPw = document.getElementById('checkPassword').value;
        if (inputPw === currentTargetData.password) {
            if (confirm('정말 삭제하시겠습니까?')) {
                await deleteDoc(doc(db, "reviews", currentTargetId));
                alert('삭제되었습니다.');
                if(window.closeModal) window.closeModal('passwordModal');
                loadReviews();
            }
        } else {
            showPasswordError();
        }
    });
});

// --- 2. Public Review Functions ---
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
                <div class="review-menu-btn" onclick="openPasswordCheck('${id}')">⋮</div>
                <p style="white-space:pre-wrap;">${escapeHTML(data.content)}</p>
                <div class="reviewer">
                    <div class="reviewer-avatar" style="background:var(--primary);">${(data.name||"익")[0]}</div>
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

window.openPasswordCheck = async (id) => {
    const snap = await getDoc(doc(db, "reviews", id));
    if (snap.exists()) {
        currentTargetId = id;
        currentTargetData = snap.data();
        const modal = document.getElementById('passwordModal');
        if (modal) {
            document.getElementById('checkPassword').value = '';
            document.getElementById('passwordError').style.display = 'none';
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
};

function openEditModal(id, data) {
    const modal = document.getElementById('editModal');
    if (modal) {
        document.getElementById('editReviewId').value = id;
        document.getElementById('editName').value = data.name || '';
        document.getElementById('editGrade').value = data.grade || '';
        document.getElementById('editContent').value = data.content || '';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function showPasswordError() {
    const err = document.getElementById('passwordError');
    if (err) err.style.display = 'block';
}

// Admin Support (Existing)
onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    if (user) {
        if (path.includes('login')) location.href = 'admin.html';
        if (path.includes('admin')) loadAdminData();
    } else {
        if (path.includes('admin')) location.href = 'login.html';
    }
});

async function loadAdminData() {
    loadAdminStats();
    loadAdminReviews();
    loadAdminSchedules();
    loadAdminInquiries();
}

// ... (Other admin functions same as previous version)
async function loadAdminStats() { /* ... */ }
async function loadAdminReviews() { /* ... */ }
async function loadAdminInquiries() { /* ... */ }
async function loadAdminSchedules() { /* ... */ }

// Utils
function maskName(n) { if(!n || n.length<=1) return n; return n[0]+"*"+(n.length>2?n[n.length-1]:""); }
function escapeHTML(str) { if(!str) return ''; return str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t])); }

loadReviews();
const todayStr = new Date().toISOString().split('T')[0];
async function trackVisit() { /* Same as before */ }
trackVisit();
loadSchedules();
