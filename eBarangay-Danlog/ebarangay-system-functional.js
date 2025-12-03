/* ================================================
   Barangay Danlog - eBarangay System
   Complete JavaScript with API Integration
   ================================================ */

// API Base URL
const API_URL = 'api/';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
});

function initializeSystem() {
    setupNavigation();
    setupModals();
    setupForms();
    setupNotifications();
    setupMobileMenu();
    setupSearch();
    loadDashboardData();
    animateStatNumbers();
    setupCharts();
    console.log('✅ Barangay Danlog eBarangay System initialized successfully!');
}

// ===== API HELPER FUNCTIONS =====
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const url = method === 'GET' && data ? 
            `${API_URL}${endpoint}?${new URLSearchParams(data)}` : 
            `${API_URL}${endpoint}`;

        const response = await fetch(url, options);
        const result = await response.json();

        return result;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Network error occurred' };
    }
}

// ===== NAVIGATION SYSTEM =====
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const section = this.getAttribute('data-section');
            showSection(section);

            const sectionTitle = this.querySelector('span').textContent;
            document.getElementById('pageTitle').textContent = sectionTitle;
            closeMobileMenu();
        });
    });
}

function showSection(sectionName) {
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => section.classList.remove('active'));

    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
        loadSectionData(sectionName);
    }
}

function loadSectionData(section) {
    switch(section) {
        case 'residents':
            loadResidentsData();
            break;
        case 'clearances':
            loadClearancesData();
            break;
        case 'permits':
            loadPermitsData();
            break;
        case 'blotter':
            loadBlotterData();
            break;
        case 'pets':
            loadPetsData();
            break;
        case 'announcements':
            loadAnnouncementsData();
            break;
    }
}

// ===== MODAL SYSTEM =====
function setupModals() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }
}

function openModal(modalName, type = null) {
    const modal = document.getElementById(modalName + 'Modal');
    const overlay = document.getElementById('modalOverlay');

    if (modal && overlay) {
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (type && modal.dataset) {
            modal.dataset.type = type;
        }
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    const overlay = document.getElementById('modalOverlay');

    modals.forEach(modal => modal.classList.remove('active'));
    if (overlay) overlay.classList.remove('active');

    document.body.style.overflow = 'auto';

    const forms = document.querySelectorAll('.modal form');
    forms.forEach(form => form.reset());
}

// ===== FORM HANDLING =====
function setupForms() {
    // Add Resident Form
    const addResidentForm = document.getElementById('addResidentForm');
    if (addResidentForm) {
        addResidentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitResident();
        });
    }

    // Issue Clearance Form
    const issueClearanceForm = document.getElementById('issueClearanceForm');
    if (issueClearanceForm) {
        issueClearanceForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitClearance();
        });
    }

    // Register Pet Form
    const registerPetForm = document.getElementById('registerPetForm');
    if (registerPetForm) {
        registerPetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitPetRegistration();
        });
    }

    // File Blotter Form
    const fileBlotterForm = document.getElementById('fileBlotterForm');
    if (fileBlotterForm) {
        fileBlotterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitBlotter();
        });
    }

    // Business Permit Form
    const businessPermitForm = document.getElementById('businessPermitForm');
    if (businessPermitForm) {
        businessPermitForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitBusinessPermit();
        });
    }

    // Announcement Form
    const announcementForm = document.getElementById('announcementForm');
    if (announcementForm) {
        announcementForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitAnnouncement();
        });
    }
}

// ===== DATA LOADING FUNCTIONS =====
async function loadResidentsData() {
    showLoading('Loading residents...');

    const result = await apiRequest('residents.php', 'GET', { status: 'active' });

    hideLoading();

    if (result.success) {
        const tbody = document.getElementById('residentsTableBody');
        if (tbody) {
            tbody.innerHTML = result.data.map(resident => `
                <tr>
                    <td><strong>RES-${resident.resident_id}</strong></td>
                    <td>${resident.first_name} ${resident.last_name}</td>
                    <td>${calculateAge(resident.birth_date)}</td>
                    <td>${resident.gender}</td>
                    <td>${resident.address}, ${resident.purok}</td>
                    <td>${resident.contact_number || 'N/A'}</td>
                    <td><span class="badge badge-success">${resident.status}</span></td>
                    <td>
                        <button class="btn-icon" onclick="viewResident(${resident.resident_id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="editResident(${resident.resident_id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="deleteResident(${resident.resident_id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } else {
        showNotification(result.message, 'error');
    }
}

async function loadClearancesData() {
    showLoading('Loading clearances...');

    const result = await apiRequest('clearances.php', 'GET', { status: 'active' });

    hideLoading();

    if (result.success) {
        const tbody = document.getElementById('clearancesTableBody');
        if (tbody) {
            tbody.innerHTML = result.data.map(cert => `
                <tr>
                    <td><strong>${cert.certificate_number}</strong></td>
                    <td>${cert.resident_name}</td>
                    <td>${formatClearanceType(cert.clearance_type)}</td>
                    <td>${cert.purpose}</td>
                    <td>${formatDate(cert.issued_date)}</td>
                    <td>${cert.issued_by_name}</td>
                    <td>
                        <button class="btn-icon" onclick="viewClearance('${cert.certificate_number}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="printClearance('${cert.certificate_number}')" title="Print">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } else {
        showNotification(result.message, 'error');
    }
}

async function loadPermitsData() {
    showLoading('Loading business permits...');

    const result = await apiRequest('permits.php', 'GET');

    hideLoading();

    if (result.success) {
        const tbody = document.getElementById('permitsTableBody');
        if (tbody) {
            tbody.innerHTML = result.data.map(permit => `
                <tr>
                    <td><strong>${permit.permit_number}</strong></td>
                    <td>${permit.business_name}</td>
                    <td>${permit.owner_name}</td>
                    <td>${formatBusinessType(permit.business_type)}</td>
                    <td>${formatDate(permit.issued_date)}</td>
                    <td><span class="badge badge-${permit.status === 'active' ? 'success' : 'danger'}">${permit.status}</span></td>
                    <td>
                        <button class="btn-icon" onclick="viewPermit('${permit.permit_number}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } else {
        showNotification(result.message, 'error');
    }
}

async function loadBlotterData() {
    showLoading('Loading blotter reports...');

    const result = await apiRequest('blotter.php', 'GET');

    hideLoading();

    if (result.success) {
        const tbody = document.getElementById('blotterTableBody');
        if (tbody) {
            tbody.innerHTML = result.data.map(blotter => `
                <tr>
                    <td><strong>${blotter.blotter_number}</strong></td>
                    <td>${formatIncidentType(blotter.incident_type)}</td>
                    <td>${blotter.reporter_name}</td>
                    <td>${formatDate(blotter.incident_date)}</td>
                    <td><span class="badge badge-${getStatusBadge(blotter.status)}">${blotter.status}</span></td>
                    <td>
                        <button class="btn-icon" onclick="viewBlotter('${blotter.blotter_number}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } else {
        showNotification(result.message, 'error');
    }
}

async function loadPetsData() {
    showLoading('Loading pet registrations...');

    const result = await apiRequest('pets.php', 'GET');

    hideLoading();

    if (result.success) {
        const tbody = document.getElementById('petsTableBody');
        if (tbody) {
            tbody.innerHTML = result.data.map(pet => `
                <tr>
                    <td><strong>${pet.pet_number}</strong></td>
                    <td>${pet.pet_name}</td>
                    <td>${capitalize(pet.species)}</td>
                    <td>${pet.breed || 'N/A'}</td>
                    <td>${pet.owner_name}</td>
                    <td>${pet.age || 'N/A'}</td>
                    <td><span class="badge badge-${pet.vaccination_status === 'updated' ? 'success' : 'warning'}">${pet.vaccination_status}</span></td>
                    <td>
                        <button class="btn-icon" onclick="viewPet('${pet.pet_number}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } else {
        showNotification(result.message, 'error');
    }
}

async function loadAnnouncementsData() {
    const result = await apiRequest('announcements.php', 'GET');

    if (result.success) {
        console.log('Loaded', result.data.length, 'announcements');
        // Display announcements in UI
    }
}

function loadDashboardData() {
    // Load dashboard statistics
    loadResidentsData();
    loadClearancesData();
}

// ===== FORM SUBMISSION FUNCTIONS =====
async function submitResident() {
    const form = document.getElementById('addResidentForm');
    const formData = new FormData(form);

    const data = {
        firstName: formData.get('firstName'),
        middleName: formData.get('middleName'),
        lastName: formData.get('lastName'),
        birthDate: formData.get('birthDate'),
        gender: formData.get('gender'),
        civilStatus: formData.get('civilStatus'),
        contactNumber: formData.get('contactNumber'),
        email: formData.get('email'),
        address: formData.get('address'),
        purok: formData.get('purok'),
        occupation: formData.get('occupation'),
        voterStatus: formData.get('voterStatus'),
        pwdStatus: formData.get('pwdStatus'),
        seniorCitizen: formData.get('seniorCitizen')
    };

    showLoading('Saving resident...');

    const result = await apiRequest('residents.php', 'POST', data);

    hideLoading();

    if (result.success) {
        showNotification('Resident added successfully!', 'success');
        closeModal();
        loadResidentsData();
    } else {
        showNotification(result.message, 'error');
    }
}

async function submitClearance() {
    const form = document.getElementById('issueClearanceForm');
    const formData = new FormData(form);

    const data = {
        residentName: formData.get('residentName') || document.querySelector('input[list="residentsList"]').value,
        certificateType: formData.get('certificateType'),
        purpose: formData.get('purpose'),
        orNumber: formData.get('orNumber'),
        amount: formData.get('amount')
    };

    showLoading('Issuing clearance...');

    const result = await apiRequest('clearances.php', 'POST', data);

    hideLoading();

    if (result.success) {
        showNotification('Clearance issued successfully!', 'success');
        closeModal();
        loadClearancesData();
    } else {
        showNotification(result.message, 'error');
    }
}

async function submitBusinessPermit() {
    const form = document.getElementById('businessPermitForm');
    const formData = new FormData(form);

    const data = {
        businessName: formData.get('businessName'),
        businessType: formData.get('businessType'),
        permitType: formData.get('permitType'),
        businessAddress: formData.get('businessAddress'),
        ownerName: formData.get('ownerName'),
        ownerContact: formData.get('ownerContact'),
        ownerEmail: formData.get('ownerEmail')
    };

    showLoading('Processing permit...');

    const result = await apiRequest('permits.php', 'POST', data);

    hideLoading();

    if (result.success) {
        showNotification('Business permit issued successfully!', 'success');
        closeModal();
        loadPermitsData();
    } else {
        showNotification(result.message, 'error');
    }
}

async function submitBlotter() {
    const form = document.getElementById('fileBlotterForm');
    const formData = new FormData(form);

    const data = {
        reporterName: formData.get('reporterName'),
        reporterContact: formData.get('reporterContact'),
        reporterAddress: formData.get('reporterAddress'),
        incidentType: formData.get('incidentType'),
        description: formData.get('description'),
        incidentDate: formData.get('incidentDate'),
        incidentLocation: formData.get('incidentLocation'),
        respondent: formData.get('respondent'),
        witnesses: formData.get('witnesses')
    };

    showLoading('Filing blotter report...');

    const result = await apiRequest('blotter.php', 'POST', data);

    hideLoading();

    if (result.success) {
        showNotification('Blotter report filed successfully!', 'success');
        closeModal();
        loadBlotterData();
    } else {
        showNotification(result.message, 'error');
    }
}

async function submitPetRegistration() {
    const form = document.getElementById('registerPetForm');
    const formData = new FormData(form);

    const data = {
        ownerName: document.querySelector('#registerPetForm input[list="residentsList"]').value,
        petName: formData.get('petName'),
        species: formData.get('species'),
        breed: formData.get('breed'),
        age: formData.get('age'),
        gender: formData.get('gender'),
        color: formData.get('color'),
        vaccination: formData.get('vaccination')
    };

    showLoading('Registering pet...');

    const result = await apiRequest('pets.php', 'POST', data);

    hideLoading();

    if (result.success) {
        showNotification('Pet registered successfully!', 'success');
        closeModal();
        loadPetsData();
    } else {
        showNotification(result.message, 'error');
    }
}

async function submitAnnouncement() {
    const form = document.getElementById('announcementForm');
    const formData = new FormData(form);

    const data = {
        title: formData.get('title'),
        content: formData.get('content'),
        category: formData.get('category'),
        priority: formData.get('priority'),
        publishDate: formData.get('publishDate')
    };

    showLoading('Publishing announcement...');

    const result = await apiRequest('announcements.php', 'POST', data);

    hideLoading();

    if (result.success) {
        showNotification('Announcement published successfully!', 'success');
        closeModal();
        loadAnnouncementsData();
    } else {
        showNotification(result.message, 'error');
    }
}

// ===== DELETE FUNCTION =====
async function deleteResident(id) {
    if (!confirm('Are you sure you want to delete this resident?')) {
        return;
    }

    showLoading('Deleting resident...');

    const result = await apiRequest('residents.php', 'DELETE', { resident_id: id });

    hideLoading();

    if (result.success) {
        showNotification('Resident deleted successfully!', 'success');
        loadResidentsData();
    } else {
        showNotification(result.message, 'error');
    }
}

// ===== UTILITY FUNCTIONS =====
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatClearanceType(type) {
    const types = {
        'clearance': 'Barangay Clearance',
        'residency': 'Certificate of Residency',
        'indigency': 'Certificate of Indigency'
    };
    return types[type] || type;
}

function formatBusinessType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatIncidentType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getStatusBadge(status) {
    const badges = {
        'pending': 'warning',
        'resolved': 'success',
        'under_investigation': 'info',
        'closed': 'secondary'
    };
    return badges[status] || 'info';
}

function viewResident(id) {
    showNotification('Viewing resident ID: ' + id, 'info');
}

function editResident(id) {
    showNotification('Edit functionality coming soon', 'info');
}

function viewClearance(certNo) {
    showNotification('Viewing certificate: ' + certNo, 'info');
}

function printClearance(certNo) {
    showNotification('Printing certificate: ' + certNo, 'info');
    setTimeout(() => window.print(), 500);
}

function viewPermit(permitNo) {
    showNotification('Viewing permit: ' + permitNo, 'info');
}

function viewBlotter(blotterNo) {
    showNotification('Viewing blotter: ' + blotterNo, 'info');
}

function viewPet(petNo) {
    showNotification('Viewing pet: ' + petNo, 'info');
}

function exportData(type) {
    showNotification('Exporting ' + type + ' data...', 'info');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login-unified.html';
    }
}

// ===== NOTIFICATION SYSTEM =====
function setupNotifications() {
    // Setup notification handlers
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    notification.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        zIndex: '3000',
        minWidth: '300px',
        animation: 'slideInRight 0.3s ease-out'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// ===== LOADING INDICATOR =====
function showLoading(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.id = 'loadingIndicator';
    loader.innerHTML = `
        <div style="background: rgba(0,0,0,0.7); position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 4000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 2rem 3rem; border-radius: 12px; text-align: center;">
                <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #1e3c72; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p style="color: #333; font-weight: 600;">${message}</p>
            </div>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) document.body.removeChild(loader);
}

// ===== MOBILE MENU =====
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 968) {
        sidebar.classList.remove('active');
    }
}

// ===== SEARCH =====
function setupSearch() {
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            console.log('Searching for:', query);
        });
    }
}

// ===== STATISTICS ANIMATION =====
function animateStatNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target')) || 0;
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = target;
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 20);
    });
}

// ===== CHARTS =====
function setupCharts() {
    const canvas = document.getElementById('activityChart');
    if (canvas && typeof Chart !== 'undefined') {
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Clearances',
                    data: [120, 150, 180, 145, 200, 145],
                    borderColor: '#1e3c72',
                    backgroundColor: 'rgba(30, 60, 114, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

console.log('✅ All functions loaded and connected to API!');
