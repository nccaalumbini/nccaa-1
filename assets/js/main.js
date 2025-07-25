// Configuration
const APP_URL = 'https://script.google.com/macros/s/AKfycbxY5-bISOEvAHQe_jqvt2uXN12Gz5CY3oNZKZp52nbzitkDaqsmVB0uuBDQY-Eb9gxm/exec';
const ALLOWED_EMAILS = [
    'nccaalumbini@gmail.com',
    'dipaadhikary102@gmail.com',
    'kcpooja60@gmail.com',
    'deepaadhikary102@gmail.com',
    'manishanepali155@gmail.com',
    'mamatagc15@gmail.com'
];
let currentUser = null;
let isSidebarCollapsed = false;
let currentScreen = 'dashboard';

// Language switching
function switchLanguage(lang) {
    document.querySelectorAll('[lang]').forEach(el => {
        el.classList.toggle('hidden', el.lang !== lang);
    });
}

// Navigation functions
function showScreen(screenId) {
    currentScreen = screenId;
    document.querySelectorAll('#app > div').forEach(el => {
        el.classList.toggle('hidden', el.id !== screenId);
    });

    const titles = {
        'dashboard': { en: 'Dashboard', np: 'ड्यासबोर्ड' },
        'addCadet': { en: 'Add Cadet', np: 'क्याडेट थप्नुहोस्' },
        'viewCadets': { en: 'View Cadets', np: 'क्याडेट सूची' },
        'reports': { en: 'Reports', np: 'रिपोर्टहरू' },
        'settings': { en: 'Sett ings', np: 'सेटिङहरू' }
    };

    const titleEl = document.getElementById('screenTitle');
    if (titleEl) {
        titleEl.textContent = titles[screenId].en;
        if (titleEl.nextElementSibling) {
            titleEl.nextElementSibling.textContent = titles[screenId].np;
        }
    }

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`button[onclick="showScreen('${screenId}')"]`).classList.add('active');

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');

    if (screenId === 'viewCadets') {
        loadCadetTable();
    }
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const app = document.getElementById('app');
    isSidebarCollapsed = !isSidebarCollapsed;

    if (isSidebarCollapsed) {
        sidebar.classList.add('sidebar-collapsed');
        sidebar.classList.remove('w-64');
        sidebar.classList.add('w-20');
        app.classList.remove('ml-64');
        app.classList.add('ml-20');
        // Hide logo text and nav-text
        sidebar.querySelector('.text-lg').classList.add('hidden');
        sidebar.querySelectorAll('.nav-text').forEach(el => el.classList.add('hidden'));
        sidebar.querySelectorAll('.lang-text, .logout-text').forEach(el => el.classList.add('hidden'));
        sidebar.querySelectorAll('.lang-btn, .logout-btn').forEach(el => el.classList.add('justify-center'));
        sidebar.querySelector('.sidebar-footer').classList.add('items-center');
        document.getElementById('sidebarToggle').innerHTML = '<i class="fas fa-chevron-right"></i>';
    } else {
        sidebar.classList.remove('sidebar-collapsed');
        sidebar.classList.remove('w-20');
        sidebar.classList.add('w-64');
        app.classList.remove('ml-20');
        app.classList.add('ml-64');
        sidebar.querySelector('.text-lg').classList.remove('hidden');
        sidebar.querySelectorAll('.nav-text').forEach(el => el.classList.remove('hidden'));
        sidebar.querySelectorAll('.lang-text, .logout-text').forEach(el => el.classList.remove('hidden'));
        sidebar.querySelectorAll('.lang-btn, .logout-btn').forEach(el => el.classList.remove('justify-center'));
        sidebar.querySelector('.sidebar-footer').classList.remove('items-center');
        document.getElementById('sidebarToggle').innerHTML = '<i class="fas fa-chevron-left"></i>';
    }
}

// Loader
function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}
function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

// Logout
function logout() {
    sessionStorage.removeItem('nccaa_user');
    google.accounts.id.disableAutoSelect();
    location.reload();
}

// Search Cadets
function searchCadets() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('#cadetTableBody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}
document.getElementById('searchInput').addEventListener('input', searchCadets);

// Google Sign-In
function handleLogin(response) {
    showLoader();
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    if (ALLOWED_EMAILS.includes(payload.email)) {
        currentUser = payload;
        sessionStorage.setItem('nccaa_user', JSON.stringify(payload));
        document.getElementById('userName').textContent = payload.name;
        showApp();
        loadDashboardStats();
    } else {
        alert('Access restricted to NCCAA administrators only');
        google.accounts.id.disableAutoSelect();
    }
    hideLoader();
}

// Form submission
document.getElementById('cadetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoader();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Hide all previous errors
    document.querySelectorAll('#cadetForm .border-red-500').forEach(el => el.classList.remove('border-red-500'));
    document.querySelectorAll('#cadetForm [id^="error-"]').forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });

    let hasError = false;

    // Cadet Number
    if (!/^NCC-\d{5}$/.test(data.cadet_no)) {
        const input = document.querySelector('[name="cadet_no"]');
        input.classList.add('border-red-500');
        document.getElementById('error-cadet_no').textContent = 'Cadet Number must be in NCC-XXXXX format (e.g., NCC-00123)';
        document.getElementById('error-cadet_no').classList.remove('hidden');
        hasError = true;
    }

    // Name
    if (!data.name || !data.name.trim()) {
        const input = document.querySelector('[name="name"]');
        input.classList.add('border-red-500');
        document.getElementById('error-name').textContent = 'Full Name is required';
        document.getElementById('error-name').classList.remove('hidden');
        hasError = true;
    }

    // Contact
    if (!/^\d{10}$/.test(data.contact)) {
        const input = document.querySelector('[name="contact"]');
        input.classList.add('border-red-500');
        document.getElementById('error-contact').textContent = 'Contact must be a 10-digit number';
        document.getElementById('error-contact').classList.remove('hidden');
        hasError = true;
    }

    // Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        const input = document.querySelector('[name="email"]');
        input.classList.add('border-red-500');
        document.getElementById('error-email').textContent = 'Invalid email address';
        document.getElementById('error-email').classList.remove('hidden');
        hasError = true;
    }

    // Guardian Contact
    if (!/^\d{10}$/.test(data.guardian_contact)) {
        const input = document.querySelector('[name="guardian_contact"]');
        input.classList.add('border-red-500');
        document.getElementById('error-guardian_contact').textContent = 'Guardian Contact must be a 10-digit number';
        document.getElementById('error-guardian_contact').classList.remove('hidden');
        hasError = true;
    }

    if (hasError) {
        hideLoader();
        return;
    }

    // If no errors, proceed to submit
    try {
        const response = await fetch(APP_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            alert('Cadet registered successfully!');
            e.target.reset();
            loadDashboardStats();
            showScreen('dashboard');
        } else {
            errorDiv.textContent = result.error || 'Registration failed. Please try again.';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = 'Registration failed. Please try again.';
        errorDiv.classList.remove('hidden');
    }
    hideLoader();
});

// Dashboard stats
async function loadDashboardStats() {
    showLoader();
    try {
        const response = await fetch(`${APP_URL}?action=stats`);
        const result = await response.json();
        if (result.success) {
            document.getElementById('totalCadets').textContent = result.stats.total;
            document.getElementById('maleCadets').textContent = result.stats.male;
            document.getElementById('femaleCadets').textContent = result.stats.female;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
    hideLoader();
}

async function loadCadetTable() {
    showLoader();
    try {
        // Get all districts
        const districtsRes = await fetch(`${APP_URL}?action=districts`);
        const districtsData = await districtsRes.json();
        let allCadets = [];
        for (const district of districtsData.districts) {
            const cadetRes = await fetch(`${APP_URL}?action=cadets&district=${encodeURIComponent(district)}`);
            const cadetData = await cadetRes.json();
            if (cadetData.success) {
                allCadets = allCadets.concat(cadetData.cadets.map(cadet => ({
                    ...cadet,
                    District: district
                })));
            }
        }
        renderCadetTable(allCadets);
    } catch (error) {
        console.error('Error loading cadets:', error);
    }
    hideLoader();
}

function renderCadetTable(cadets) {
    const tbody = document.getElementById('cadetTableBody');
    tbody.innerHTML = '';
    cadets.forEach((cadet, idx) => {
        const cadetId = `${cadet.Timestamp}_${cadet.District}`;
        tbody.innerHTML += `
        <tr>
            <td class="py-2 px-2">${cadet['Cadet Number'] || ''}</td>
            <td class="py-2 px-2">${cadet.Name}</td>
            <td class="py-2 px-2"><span class="bg-olive-100 text-olive-800 px-3 py-1 rounded-full text-sm">${cadet.Rank}</span></td>
            <td class="py-2 px-2">${cadet.Contact}</td>
            <td class="py-2 px-2">${cadet.Gender}</td>
            <td class="py-2 px-2">${cadet['School Name']}</td>
            <td class="py-2 px-2">${cadet.District}</td>
            <td class="py-2 px-2">
                <div class="flex gap-2">
                    <button class="text-blue-600 hover:text-blue-800" onclick="viewCadet('${cadetId}')"><i class="fas fa-eye"></i></button>
                    <button class="text-olive-600 hover:text-olive-800" onclick="editCadet('${cadetId}')"><i class="fas fa-edit"></i></button>
                    <button class="text-red-600 hover:text-red-800" onclick="deleteCadet('${cadetId}')"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        </tr>
    `;
    });
    window.cadetList = cadets; // Store for later use
}

function showModal(cadet) {
    // Fill modal fields
    document.getElementById('cadetModalName').textContent = cadet.Name || '';
    document.getElementById('cadetModalRank').textContent = cadet.Rank || '';
    document.getElementById('cadetModalDistrict').textContent = cadet.District || '';
    document.getElementById('cadetModalContact').textContent = cadet.Contact || '';
    document.getElementById('cadetModalGender').textContent = cadet.Gender || '';
    document.getElementById('cadetModalSchool').textContent = cadet['School Name'] || '';
    document.getElementById('cadetModalBatch').textContent = cadet['NCC Batch'] || '';
    document.getElementById('cadetModalPassout').textContent = cadet['Passout Year'] || '';
    document.getElementById('cadetModalEmail').textContent = cadet.Email || '';
    document.getElementById('cadetModalAddress').textContent = cadet.Address || '';
    document.getElementById('cadetModalGuardianName').textContent = cadet['Guardian Name'] || '';
    document.getElementById('cadetModalGuardianContact').textContent = cadet['Guardian Contact'] || '';
    document.getElementById('cadetModalRelation').textContent = cadet.Relation || '';
    document.getElementById('cadetModalCadetNo').textContent = cadet['Cadet Number'] || '';
    document.getElementById('cadetModal').classList.remove('hidden');
}

// Close modal logic
document.getElementById('closeCadetModal').addEventListener('click', () => {
    document.getElementById('cadetModal').classList.add('hidden');
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.getElementById('cadetModal').classList.add('hidden');
});

// Update viewCadet to use showModal
function viewCadet(cadetId) {
    const cadet = window.cadetList.find(c => `${c.Timestamp}_${c.District}` === cadetId);
    if (!cadet) return;
    showModal(cadet);
}

// Initialize app
function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    switchLanguage('en'); // Default language
    showScreen('dashboard');
}

// Check session on load
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('nccaa_user');
    if (savedUser && ALLOWED_EMAILS.includes(JSON.parse(savedUser).email)) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('userName').textContent = currentUser.name;
        showApp();
        loadDashboardStats();
    }


    // Set up event listeners
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('mobileMenuBtn').onclick = function () {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sidebarOverlay').style.display = 'block';
        document.body.classList.add('sidebar-open');
    }
    // Optional: close sidebar on Esc key
    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSidebar();
    });

    // Auto logout when tab closes
    window.addEventListener('beforeunload', () => {
        sessionStorage.removeItem('nccaa_user');
    });
});
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').style.display = 'none';
    document.body.classList.remove('sidebar-open');
}
function doPost(e) {
    return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader("Access-Control-Allow-Origin", "*");
}

function editCadet(cadetId) {
    const cadet = window.cadetList.find(c => `${c.Timestamp}_${c.District}` === cadetId);
    if (!cadet) return;

    // Set all form fields
    document.getElementById('editCadetNo').value = cadet['Cadet Number'] || '';
    document.getElementById('editOriginalCadetNo').value = cadet['Cadet Number'] || '';
    document.getElementById('editName').value = cadet.Name || '';
    document.getElementById('editRank').value = cadet.Rank || '';
    document.getElementById('editContact').value = cadet.Contact || '';
    document.getElementById('editGender').value = cadet.Gender || '';
    document.getElementById('editSchool').value = cadet['School Name'] || '';
    document.getElementById('editBatch').value = cadet['NCC Batch'] || '';
    document.getElementById('editPassoutYear').value = cadet['Passout Year'] || '';
    document.getElementById('editDistrict').value = cadet.District || '';
    document.getElementById('editAddress').value = cadet.Address || '';
    document.getElementById('editEmail').value = cadet.Email || '';
    document.getElementById('editGuardianName').value = cadet['Guardian Name'] || '';
    document.getElementById('editGuardianContact').value = cadet['Guardian Contact'] || '';
    document.getElementById('editRelation').value = cadet.Relation || '';

    document.getElementById('editCadetModal').classList.remove('hidden');
}

// // Close modal when clicking outside the modal content
// document.getElementById('editCadetModal').addEventListener('click', function (e) {
//     if (e.target === this) {
//         this.classList.add('hidden');
//     }
// });

// Edit form submission
document.getElementById('editCadetForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoader();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.action = "edit";

    try {
        const response = await fetch(APP_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            alert('Cadet updated successfully!');
            document.getElementById('editCadetModal').classList.add('hidden');
            loadCadetTable(); // Refresh the table
        } else {
            alert('Update failed: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Update failed. Please try again.');
    } finally {
        hideLoader();
    }
});
document.getElementById('closeEditCadetModal').addEventListener('click', function () {
    document.getElementById('editCadetModal').classList.add('hidden');
});

function deleteCadet(cadetId) {
    if (!confirm('Are you sure you want to delete this cadet?')) return;
    const cadet = window.cadetList.find(c => `${c.Timestamp}_${c.District}` === cadetId);
    if (!cadet) return alert('Cadet not found.');

    showLoader();

    fetch(APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'delete',
            cadet_no: cadet['Cadet Number'],
            district: cadet.District
        })
    })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert('Cadet deleted successfully!');
                loadCadetTable();
            } else {
                alert('Delete failed: ' + (result.error || 'Unknown error'));
            }
        })
        .catch(() => alert('Delete failed. Please try again.'))
        .finally(hideLoader);
}
