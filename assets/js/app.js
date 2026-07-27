import { state } from './state.js';
import { flushPendingTelemetry, downloadDebugLogs } from './telemetry.js';
import { loadAIInsights, loadSubjects, loadChapters, fetchAssessments } from './api.js';
import { initTheme, toggleTheme, loadXP, setDailyMotivation, showToast, navigateTo, navigateBack, confirmQuit, closeQuitModal, executeQuit } from './uiControls.js';
import { loadMockExams, downloadQP, downloadMS, openSubjectPapers } from './mockExams.js';
import { nextQuestion, retryAssessment } from './quizEngine.js';

// ==========================================
// INITIALIZATION & IDENTITY
// ==========================================
window.onload = () => {
    console.log("🚀 System Initialization Started.");
    initTheme();
    loadXP();
    setDailyMotivation();
    checkUserIdentity(); 
    loadAIInsights(); // Load AI Widget Data
    initializeEventListeners();
    
    // THE BOOTLOADER: Check if the user refreshed on a specific page
    const targetScreen = window.location.hash.replace('#', '') || 'subject-screen';
    restoreStateRouter(targetScreen);
};

window.addEventListener('beforeunload', (e) => {
    if(state.isQuizActive) { e.preventDefault(); e.returnValue = ''; }
});

// ==========================================
// HYBRID STATE ROUTER LOGIC
// ==========================================
function restoreStateRouter(screenId) {
    console.log(`🔄 Reconstructing state for: ${screenId}`);
    
    // Read the breadcrumbs dropped by api.js and mockExams.js
    const savedSubject = localStorage.getItem('studyPortal_subject');
    const savedChapter = localStorage.getItem('studyPortal_chapter');
    const savedUrl = localStorage.getItem('studyPortal_chapterUrl');
    const savedMock = localStorage.getItem('studyPortal_mockSubject');

    // Reconstruct the deep views natively based on the URL hash
    if (screenId === 'chapter-screen' && savedSubject) {
        state.subject = savedSubject;
        loadChapters(savedSubject);
    } else if (screenId === 'assessment-screen' && savedUrl && savedChapter && savedSubject) {
        state.subject = savedSubject;
        state.chapter = savedChapter;
        fetchAssessments(savedUrl, savedChapter);
    } else if (screenId === 'mock-exam-papers-screen' && savedMock) {
        openSubjectPapers(savedMock);
    } else if (screenId === 'mock-exam-screen') {
        navigateTo('mock-exam-screen');
        loadMockExams();
    } else {
        // Fallback to Dashboard
        navigateTo('subject-screen');
    }
}

// ==========================================
// USER AUTHENTICATION LOGIC
// ==========================================
function checkUserIdentity() {
    console.log("🔍 Checking localStorage for 'currentUser'...");
    const user = localStorage.getItem('currentUser');
    if (!user) {
        console.warn("⚠️ No user found. Displaying Login Modal.");
        document.getElementById('user-modal').classList.remove('hidden-screen');
    } else {
        console.log(`✅ User found: [${user}]. Skipping login.`);
        flushPendingTelemetry();
    }
}

function saveUserIdentity(event) {
    // Only call preventDefault if an event object is actually passed
    if (event && event.preventDefault) event.preventDefault();
    console.log("🖱️ Login form submitted.");
    
    const input = document.getElementById('username-input').value.trim();
    console.log(`📝 Input received: [${input}]`);
    
    if (!input) {
        console.error("❌ Input was empty after trim.");
        return;
    }

    // --- SECRET DEBUG TRIGGER ---
    if (input.toLowerCase() === 'admin debug') {
        console.log("🕵️ Secret debug command triggered!");
        downloadDebugLogs();
        showToast("Debug logs downloaded!");
        return; 
    }

    try {
        localStorage.setItem('currentUser', input);
        console.log("💾 Saved user to localStorage.");
        
        document.getElementById('user-modal').classList.add('hidden-screen');
        console.log("🙈 Modal hidden successfully.");
        
        showToast(`Welcome, ${input}!`);
        flushPendingTelemetry();
    } catch (e) {
        console.error("❌ Failed to save user identity:", e);
        alert("Error saving login. Is Private Browsing blocking local storage?");
    }
}

// ==========================================
// DOM EVENT WIRING
// ==========================================
/**
 * Centralized function to attach all event listeners, decoupling JS from HTML.
 */
function initializeEventListeners() {
    console.log("🔌 Initializing event listeners...");

    // User Identity Modal
    const userForm = document.getElementById('user-identity-form');
    if (userForm) userForm.addEventListener('submit', saveUserIdentity);

    // Quit Confirmation Modal
    const btnQuitConfirm = document.getElementById('btn-quit-confirm');
    if (btnQuitConfirm) btnQuitConfirm.addEventListener('click', executeQuit);
    
    const btnQuitCancel = document.getElementById('btn-quit-cancel');
    if (btnQuitCancel) btnQuitCancel.addEventListener('click', closeQuitModal);

    // Header Buttons
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.addEventListener('click', navigateBack);
    
    const btnPastPapers = document.getElementById('btn-past-papers');
    if (btnPastPapers) {
        btnPastPapers.addEventListener('click', () => {
            navigateTo('mock-exam-screen');
            loadMockExams();
        });
    }
    
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    if (btnToggleTheme) btnToggleTheme.addEventListener('click', toggleTheme);

    // Quiz Screen Buttons
    const btnQuitAssessment = document.getElementById('btn-quit-assessment');
    if (btnQuitAssessment) btnQuitAssessment.addEventListener('click', confirmQuit);
    
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);

    // Results Screen Buttons
    const btnRetryAssessment = document.getElementById('btn-retry-assessment');
    if (btnRetryAssessment) btnRetryAssessment.addEventListener('click', retryAssessment);
    
    const btnReturnDashboard = document.getElementById('btn-return-dashboard');
    if (btnReturnDashboard) btnReturnDashboard.addEventListener('click', () => navigateTo('subject-screen'));

    // Expose functions needed by dynamically generated content in other modules
    window.navigateTo = navigateTo;
    window.loadMockExams = loadMockExams;
    window.downloadQP = downloadQP;
    window.downloadMS = downloadMS;

    console.log("✅ Event listeners attached.");
}

// Re-attach modal functions to the global window so dynamically generated HTML onclicks work
window.confirmQuit = confirmQuit;
window.closeQuitModal = closeQuitModal;
window.executeQuit = executeQuit;
window.openSubjectPapers = openSubjectPapers;