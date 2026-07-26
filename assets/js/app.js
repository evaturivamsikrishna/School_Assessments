
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

// ==========================================
// ATTACH TO WINDOW FOR HTML on-click ATTRIBUTES
// ==========================================
window.toggleTheme = toggleTheme;
window.navigateBack = navigateBack;
window.navigateTo = navigateTo;
window.saveUserIdentity = saveUserIdentity;
window.nextQuestion = nextQuestion;
window.retryAssessment = retryAssessment;
window.confirmQuit = confirmQuit;
window.closeQuitModal = closeQuitModal;
window.executeQuit = executeQuit;
window.loadMockExams = loadMockExams;
window.downloadQP = downloadQP;
window.downloadMS = downloadMS;
