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
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        reviewContainer.innerHTML = ''; 
        if (querySnapshot.empty) {
            reviewContainer.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-muted); padding: 3rem 0;">?±Î°ù???ÑÍ∏∞Í∞Ä ?ÜÏäµ?àÎã§.</p>';
            return;
        }
        let delay = 0;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const originalName = data.name || "?µÎ™Ö";
            const card = document.createElement('div');
            card.className = 'review-card glass reveal active'; 
            card.style.transitionDelay = `${delay}s`;
            card.innerHTML = `
                <button class="review-options" title="?òÏ†ï/??†ú" data-id="${id}" data-pw="${data.password || ''}" data-name="${escapeHTML(originalName)}" data-grade="${escapeHTML(data.grade || '')}" data-content="${escapeHTML(data.content || '')}">
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
                        <strong style="color:white; font-size:1.2rem; display:block; margin-bottom:0.5rem;">?ÑÏû¨ ?ïÍ∑ú Î∞òÏ? ÎßàÍ∞ê ?ÅÌÉú?ÖÎãà??</strong>
                        ?ÅÎã¥ ?†Ï≤≠ ???ÄÍ∏??±Î°ù ???∞ÏÑ† ?àÎÇ¥?úÎ¶Ω?àÎã§.
                    </td>
                </tr>`;
            return;
        }
        scheduleContainer.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let statusColor = '#3b82f6';
            if (data.status === 'ÎßàÍ∞ê ?ÑÎ∞ï') statusColor = '#ef4444';
            if (data.status === 'Î™®Ïßë Ï§?) statusColor = '#22c55e';
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
        submitBtn.textContent = '?†Ï≤≠ Ï≤òÎ¶¨ Ï§?..';
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

            alert(`${data.name} ?ôÎ?Î™®Îãò, ?ÅÎã¥ ?àÏïΩ ?†Ï≤≠???±Í≥µ?ÅÏúºÎ°??ÑÎã¨?òÏóà?µÎãà??\n?Ä?úÎ≥¥?úÏ? ?¥Î©î?ºÎ°ú??Í∏∞Î°ù?òÏóà?µÎãà??`);
            reservationForm.reset();
            const rm = document.getElementById('reservationModal');
            if(rm) rm.classList.remove('active');
            document.body.style.overflow = '';
        } catch (error) {
            alert("Ï≤òÎ¶¨ Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§. ?ôÏõê?ºÎ°ú ÏßÅÏ†ë ?ÑÌôî Î¨∏Ïùò Î∂Ä?ÅÎìúÎ¶ΩÎãà??");
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
            if (confirm('?ïÎßêÎ°???†ú?òÏãúÍ≤†Ïäµ?àÍπå?')) {
                await deleteDoc(doc(db, "reviews", targetReviewId.value));
                alert('??†ú?òÏóà?µÎãà??');
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
            alert('?òÏ†ï ?ÑÎ£å!');
            closeAll();
            loadReviews();
            if (adminReviewList) loadAdminReviews();
        } catch (e) { alert('?òÏ†ï ?§Ìå®'); }
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
            alert('?ÑÍ∏∞ ?±Î°ù ?ÑÎ£å!');
            reviewForm.reset();
            if(reviewModal) reviewModal.classList.remove('active');
            document.body.style.overflow = '';
            loadReviews();
        } catch (e) { alert('?§Ìå®'); }
    };
}

// --- Admin Dashboard Logic ---
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
            location.href = 'admin.html';
        } catch (e) { alert('Î°úÍ∑∏???§Ìå®'); }
    };
}
if (logoutBtn) {
    logoutBtn.onclick = async () => { if(confirm('Î°úÍ∑∏?ÑÏõÉ?')) { await signOut(auth); location.href = 'login.html'; } };
}

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
    loadAdminInquiries(); // Added
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
        div.innerHTML = `<div><strong>${escapeHTML(data.name)}</strong><p>${escapeHTML(data.content)}</p></div><button class="btn-danger" onclick="deleteItem('reviews', '${id}')">??†ú</button>`;
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
        div.innerHTML = `<div><strong>${escapeHTML(data.category)}</strong><p>${escapeHTML(data.course)}</p></div><div style="display:flex; gap:10px;"><button class="btn-edit" onclick="editSchedule('${id}', '${escapeHTML(data.category)}', '${escapeHTML(data.grade)}', '${escapeHTML(data.course)}', '${escapeHTML(data.time)}', '${escapeHTML(data.status)}', ${data.order})">?òÏ†ï</button><button class="btn-danger" onclick="deleteItem('schedules', '${id}')">??†ú</button></div>`;
        adminScheduleList.appendChild(div);
    });
}

// Added: Load Inquiries for Admin
async function loadAdminInquiries() {
    if (!adminInquiryList) return;
    const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    adminInquiryList.innerHTML = '';
    if (querySnapshot.empty) {
        adminInquiryList.innerHTML = '<p style="text-align:center; padding: 2rem;">ÏµúÍ∑º ?ëÏàò???ÅÎã¥ ?¥Ïó≠???ÜÏäµ?àÎã§.</p>';
        return;
    }
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;
        const date = data.createdAt ? data.createdAt.toDate().toLocaleString() : "?úÍ∞Ñ ?ïÎ≥¥ ?ÜÏùå";
        const div = document.createElement('div');
        div.className = 'admin-item glass';
        div.innerHTML = `
            <div>
                <strong>${escapeHTML(data.name)} ?ôÎ?Î™®Îãò (${escapeHTML(data.grade)})</strong>
                <p style="color:var(--primary); font-weight:600; margin: 5px 0;">?ìû ${escapeHTML(data.phone)}</p>
                <p>${escapeHTML(data.message || "?òÍ≤¨ ?ÜÏùå")}</p>
                <small style="color:var(--text-muted);">${date}</small>
            </div>
            <button class="btn-danger" onclick="deleteItem('reservations', '${id}')">??†ú</button>
        `;
        adminInquiryList.appendChild(div);
    });
}

window.deleteItem = async (col, id) => { if (confirm('?ïÎßêÎ°??¥Îãπ ?¥Ïó≠????†ú?òÏãúÍ≤†Ïäµ?àÍπå?')) { await deleteDoc(doc(db, col, id)); loadAdminData(); } };
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
        } catch (e) { alert('?§Ìå®'); }
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

// --- Î∞©Î¨∏???µÍ≥Ñ Í¥ÄÎ¶?(Admin Stats) ---
let visitorChart = null;

async function loadStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    try {
        // 1. ?ÑÏ≤¥ Î∞©Î¨∏??Î∞??§Îäò/?¥Ï†ú ?îÏïΩ ?ïÎ≥¥ Í∞Ä?∏Ïò§Í∏?        const totalSnap = await getDoc(doc(db, "stats", "visitor_info"));
        const todaySnap = await getDoc(doc(db, "daily_visits", todayStr));
        const yesterdaySnap = await getDoc(doc(db, "daily_visits", yesterdayStr));

        if (document.getElementById('totalVisits')) {
            document.getElementById('totalVisits').innerText = totalSnap.exists() ? totalSnap.data().total.toLocaleString() : '0';
            document.getElementById('todayVisits').innerText = todaySnap.exists() ? todaySnap.data().count.toLocaleString() : '0';
            document.getElementById('yesterdayVisits').innerText = yesterdaySnap.exists() ? yesterdaySnap.data().count.toLocaleString() : '0';
        }

        // 2. Ï£ºÍ∞Ñ Î∞©Î¨∏ Ï∂îÏù¥ ?∞Ïù¥??Í∞Ä?∏Ïò§Í∏?(ÏµúÏã† 7??
        const q = query(collection(db, "daily_visits"), orderBy("__name__", "desc"));
        const querySnapshot = await getDocs(q);
        
        const labels = [];
        const counts = [];
        
        // ?∞Ïù¥?∞Í? Î∂ÄÏ°±Ìï† Í≤ΩÏö∞Î•??ÄÎπÑÌï¥ ÏµúÍ∑º 7?ºÏùÑ Í∏∞Î≥∏?ºÎ°ú ?ùÏÑ±
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
            labels.push(date.slice(5)); // MM-DD ?ïÏãù?ºÎ°ú ?úÏãú
            counts.push(dataMap[date] || 0);
        });

        // 3. Chart.js ?åÎçîÎß?        renderVisitorChart(labels, counts);
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
                label: '?ºÎ≥Ñ Î∞©Î¨∏????,
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
loadStats(); // ?µÍ≥Ñ Ï¥àÍ∏∞ Î°úÎìú Ï∂îÍ?
// --- Î∞©Î¨∏???µÍ≥Ñ ?∏Îûò??(Track Visitor) ---
async function trackVisit() {
    // ?∏ÏÖò????Î≤àÎßå Ïπ¥Ïö¥??(?àÎ°úÍ≥†Ïπ® Ï§ëÎ≥µ Î∞©Ï?)
    if (sessionStorage.getItem('visited')) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyRef = doc(db, "daily_visits", today);
    const totalRef = doc(db, "stats", "visitor_info");

    try {
        // 1. ?ºÎ≥Ñ Î∞©Î¨∏??Ïπ¥Ïö¥??Ï¶ùÍ?
        const dailySnap = await getDoc(dailyRef);
        if (dailySnap.exists()) {
            await updateDoc(dailyRef, { count: increment(1) });
        } else {
            await setDoc(dailyRef, { count: 1 });
        }

        // 2. ?ÑÏ≤¥ ?ÑÏ†Å Î∞©Î¨∏??Ïπ¥Ïö¥??Ï¶ùÍ?
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

// ?§ÌÅ¨Î¶ΩÌä∏ ?§Ìñâ ???êÎèô ?∏Îûò???úÏûë
trackVisit();
