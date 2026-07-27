
import { state } from './state.js';
import { flushPendingTelemetry, downloadDebugLogs } from './telemetry.js';
import { loadAIInsights } from './api.js';
import { initTheme, toggleTheme, loadXP, setDailyMotivation, showToast, navigateTo, navigateBack, confirmQuit, closeQuitModal, executeQuit } from './uiControls.js';
import { loadMockExams, downloadQP, downloadMS } from './mockExams.js';
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
    navigateTo('subject-screen');
};

window.addEventListener('beforeunload', (e) => {
    if(state.isQuizActive) { e.preventDefault(); e.returnValue = ''; }
});

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
    event.preventDefault();
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

/**
 * Centralized function to attach all event listeners, decoupling JS from HTML.
 */
function initializeEventListeners() {
    console.log("🔌 Initializing event listeners...");

    // User Identity Modal
    document.getElementById('user-identity-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveUserIdentity(e);
    });

    // Quit Confirmation Modal
    document.getElementById('btn-quit-confirm').addEventListener('click', executeQuit);
    document.getElementById('btn-quit-cancel').addEventListener('click', closeQuitModal);

    // Header Buttons
    document.getElementById('back-btn').addEventListener('click', navigateBack);
    document.getElementById('btn-past-papers').addEventListener('click', () => {
        navigateTo('mock-exam-screen');
        loadMockExams();
    });
    document.getElementById('btn-toggle-theme').addEventListener('click', toggleTheme);

    // Quiz Screen Buttons
    document.getElementById('btn-quit-assessment').addEventListener('click', confirmQuit);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);

    // Results Screen Buttons
    document.getElementById('btn-retry-assessment').addEventListener('click', retryAssessment);
    document.getElementById('btn-return-dashboard').addEventListener('click', () => navigateTo('subject-screen'));

    // Expose functions needed by dynamically generated content in other modules
    window.navigateTo = navigateTo;
    window.loadMockExams = loadMockExams;
    window.downloadQP = downloadQP;
    window.downloadMS = downloadMS;

    console.log("✅ Event listeners attached.");
}

// Re-attach modal functions to the global window so HTML onclicks work
window.confirmQuit = confirmQuit;
window.closeQuitModal = closeQuitModal;
window.executeQuit = executeQuit;
