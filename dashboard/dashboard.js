
// Toggle dropdown
const userBtn = document.querySelector('.user-btn');
const dropdownContent = document.querySelector('.dropdown-content');

userBtn.addEventListener('click', () => {
    dropdownContent.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown')) {
        dropdownContent.classList.remove('active');
    }
});

// Form submission (prevent default for demo)
const reportForm = document.querySelector('.report-form');
reportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Report submitted successfully!');
    reportForm.reset();
});

const settingsButton = document.querySelector('.dropdown-item:first-child');
const modalBackdrop = document.querySelector('.modal-backdrop');
const closeModal = document.querySelector('.close-modal');

settingsButton.addEventListener('click', () => {
    modalBackdrop.classList.add('active');
});

closeModal.addEventListener('click', () => {
    modalBackdrop.classList.remove('active');
});

// Close modal when clicking outside
modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('active');
    }
});