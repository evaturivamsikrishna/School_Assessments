import { showToast, escapeHTML, navigateTo } from './uiControls.js';

const MANIFEST_URL = 'mock_papers/manifest.json';
const LOCK_DURATION_MS = 10800000; // 3 hours in milliseconds

// We will store the fetched and grouped data here in memory
let groupedExams = {}; 

// Visual Metadata for Subjects (Icons and Tailwind Colors)
const subjectMeta = {
    "Mathematics": { icon: "fa-calculator", style: "bg-blue-100 dark:bg-blue-900/30 text-blue-500" },
    "Maths Basic": { icon: "fa-square-root-variable", style: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500" },
    "Science": { icon: "fa-flask", style: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500" },
    "English": { icon: "fa-book-open", style: "bg-amber-100 dark:bg-amber-900/30 text-amber-500" },
    "Social": { icon: "fa-earth-americas", style: "bg-purple-100 dark:bg-purple-900/30 text-purple-500" }
};

/**
 * Helper to programmatically trigger a file download.
 */
function triggerDownload(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop(); // Suggest a filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==========================================
// SCREEN 1: Fetch and Render Subject Cards
// ==========================================
export async function loadMockExams() {
    const container = document.getElementById('mock-subject-list');
    if (!container) return;
    
    container.innerHTML = `
        <div class="col-span-full flex justify-center items-center py-12">
            <div class="spinner"></div>
        </div>`; // Show a loading spinner while fetching

    try {
        const response = await fetch(MANIFEST_URL);
        if (!response.ok) throw new Error('Network response was not ok.');
        const exams = await response.json();

        // Reset and Group the flat manifest array by subject
        groupedExams = {};
        exams.forEach(exam => {
            const cleanSubject = escapeHTML(exam.subject.replace(/_/g, ' '));
            if (!groupedExams[cleanSubject]) {
                groupedExams[cleanSubject] = [];
            }
            groupedExams[cleanSubject].push(exam);
        });

        container.innerHTML = '';
        
        // Iterate through the grouped Subjects and render cards
        Object.keys(groupedExams).forEach(subject => {
            const meta = subjectMeta[subject] || { icon: 'fa-folder', style: 'bg-brand-100 dark:bg-brand-900/30 text-brand-500' };
            
            const card = document.createElement('div');
            card.className = "bg-white dark:bg-darkcard border border-slate-200 dark:border-slate-700 rounded-3xl p-6 hover:border-brand-500 dark:hover:border-brand-500 transition-all cursor-pointer shadow-sm hover:shadow-xl group";
            
            // Pass the subject string to the next function
            card.onclick = () => openSubjectPapers(subject);
            
            card.innerHTML = `
                <div class="w-14 h-14 rounded-2xl ${meta.style} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                    <i class="fa-solid ${meta.icon}"></i>
                </div>
                <h3 class="text-xl font-bold mb-2 group-hover:text-brand-500 transition-colors">${subject}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">${groupedExams[subject].length} Papers Available</p>
            `;
            
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error("Failed to load mock exams:", error);
        container.innerHTML = `<div class="col-span-full p-6 bg-red-100 text-red-600 rounded-2xl text-center font-bold">Failed to load manifest.json. Ensure the file exists.</div>`;
    }
}

// ==========================================
// SCREEN 2: Render the Specific Years (with Lock Logic)
// ==========================================
export function openSubjectPapers(subject) {
    const container = document.getElementById('mock-paper-list');
    const title = document.getElementById('mock-papers-title');
    const iconDiv = document.getElementById('mock-papers-icon');
    
    if (!container || !title || !iconDiv) return;
    
    title.innerText = subject;
    const meta = subjectMeta[subject] || { icon: 'fa-folder-open', style: 'bg-brand-100 dark:bg-brand-900/30 text-brand-500' };
    iconDiv.className = `w-14 h-14 rounded-2xl ${meta.style} flex items-center justify-center text-2xl`;
    iconDiv.innerHTML = `<i class="fa-solid ${meta.icon}"></i>`;
    
    container.innerHTML = '';
    const papers = groupedExams[subject] || [];
    
    papers.forEach(exam => {
        const card = document.createElement('div');
        card.className = "bg-white dark:bg-darkcard border border-slate-200 dark:border-slate-700 rounded-3xl p-6 hover:border-brand-500 dark:hover:border-brand-500 transition-all shadow-sm hover:shadow-xl group flex flex-col h-full";
        
        card.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Academic Year</span>
                <span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-file-pdf text-brand-500 mr-1"></i> PDF</span>
            </div>
            
            <div class="text-3xl font-black mb-8 text-slate-800 dark:text-slate-100 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                ${escapeHTML(exam.year)}
            </div>
            
            <div class="flex flex-col gap-3 mt-auto">
                <button data-exam-id="${exam.id}" data-qp-url="${exam.qp_url}" class="btn-download-qp w-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <i class="fa-solid fa-file-arrow-down"></i> Question Paper
                </button>
                <button data-exam-id="${exam.id}" data-ms-url="${exam.ms_url}" class="btn-download-ms w-full bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <i class="fa-solid fa-lock text-slate-400"></i> Marking Scheme
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    // Add event listeners using event delegation on the container
    container.querySelectorAll('.btn-download-qp').forEach(btn => {
        btn.addEventListener('click', () => downloadQP(btn.dataset.examId, btn.dataset.qpUrl));
    });
    container.querySelectorAll('.btn-download-ms').forEach(btn => {
        btn.addEventListener('click', () => downloadMS(btn.dataset.examId, btn.dataset.msUrl));
    });
    
    // Transition to the Papers grid screen
    if (window.navigateTo) {
        window.navigateTo('mock-exam-papers-screen', true);
    } else {
        navigateTo('mock-exam-papers-screen', true);
    }
}

// ==========================================
// DOWNLOAD HANDLERS & ANTI-CHEAT LOCK LOGIC
// ==========================================
export function downloadQP(examId, url) {
    if (!url || url === '#') {
        showToast("PDF not yet uploaded.", true);
        return;
    }
    
    // Set the 3-hour timer when QP is clicked
    localStorage.setItem(`mock_exam_${examId}`, Date.now());
    triggerDownload(url);
    showToast('Question Paper download started!');
}

export function downloadMS(examId, url) {
    if (!url || url === '#') {
        showToast("PDF not yet uploaded.", true);
        return;
    }

    const startTime = localStorage.getItem(`mock_exam_${examId}`);
    
    if (!startTime) {
        return showToast("Please download the Question Paper first.", true);
    }
    
    const elapsedTime = Date.now() - parseInt(startTime, 10);
    
    // Check if 3 hours (10800000 ms) have passed
    if (elapsedTime < LOCK_DURATION_MS) {
        const minutesLeft = Math.ceil((LOCK_DURATION_MS - elapsedTime) / 60000);
        return showToast(`🔒 Locked! Unlocks in ${minutesLeft} mins`, true);
    }
    
    triggerDownload(url);
}

// Since openSubjectPapers is dynamically attached to an onclick attribute, 
// we must expose it to the global window object.
window.openSubjectPapers = openSubjectPapers;