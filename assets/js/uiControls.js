import { state, motivationQuotes } from './state.js';
import { stopTimer } from './quizEngine.js';
import { loadSubjects } from './api.js';

// ==========================================
// UTILITIES & UI LOGIC
// ==========================================
export function setDailyMotivation() {
    const quoteEl = document.getElementById('motivational-quote');
    if (!quoteEl) return;
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('studyPortal_quoteDate');
    let dailyQuote = localStorage.getItem('studyPortal_dailyQuote');

    if (storedDate !== today || !dailyQuote) {
        dailyQuote = motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
        localStorage.setItem('studyPortal_quoteDate', today);
        localStorage.setItem('studyPortal_dailyQuote', dailyQuote);
    }
    quoteEl.innerText = dailyQuote;
}

export function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

export function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const icon = toast.querySelector('i');
    toast.querySelector('#toast-msg').innerText = msg;

    if (isError) {
        toast.classList.replace('bg-slate-900', 'bg-red-500');
        toast.classList.replace('dark:bg-white', 'dark:bg-red-500');
        toast.classList.replace('dark:text-slate-900', 'dark:text-white');
        if(icon) icon.className = 'fa-solid fa-triangle-exclamation';
    } else {
        toast.classList.replace('bg-red-500', 'bg-slate-900');
        toast.classList.replace('dark:bg-red-500', 'dark:bg-white');
        toast.classList.replace('dark:text-white', 'dark:text-slate-900');
        if(icon) icon.className = 'fa-solid fa-circle-exclamation';
    }

    toast.classList.remove('opacity-0', 'translate-y-4');
    setTimeout(() => toast.classList.add('opacity-0', 'translate-y-4'), 3000);
}

export function showLoader(message) {
    const loaderText = document.getElementById('loader-text');
    if (loaderText) loaderText.innerText = message;
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.remove('hidden-screen');
}

export function hideLoader() { 
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.add('hidden-screen'); 
}

export function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeIcon();
}

export function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    updateThemeIcon();
}

export function updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.className = document.documentElement.classList.contains('dark') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
}

export function loadXP() {
    state.totalXP = parseInt(localStorage.getItem('studyPortal_XP')) || 0;
    const xpDisplay = document.getElementById('total-xp-display');
    if (xpDisplay) xpDisplay.innerText = `${state.totalXP} XP`;
}

export function addXP(amount) {
    state.totalXP += amount;
    localStorage.setItem('studyPortal_XP', state.totalXP);
    const xpDisplay = document.getElementById('total-xp-display');
    if (xpDisplay) {
        xpDisplay.innerText = `${state.totalXP} XP`;
        xpDisplay.parentElement.classList.add('streak-bump');
        setTimeout(() => xpDisplay.parentElement.classList.remove('streak-bump'), 300);
    }
}

export function triggerConfetti() {
    if (typeof confetti === 'undefined') return;
    var duration = 3 * 1000; var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    function randomInRange(min, max) { return Math.random() * (max - min) + min; }
    var interval = setInterval(function () {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        var particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
}

export function confirmQuit() { 
    const modal = document.getElementById('quit-modal');
    if (modal) modal.classList.remove('hidden-screen'); 
}

export function closeQuitModal() { 
    const modal = document.getElementById('quit-modal');
    if (modal) modal.classList.add('hidden-screen'); 
}

export function executeQuit() { 
    closeQuitModal(); 
    stopTimer(); 
    navigateTo('assessment-screen', false); 
}

export function updateHeader(screenId) {
    const title = document.getElementById('header-title');
    const subtitle = document.getElementById('header-subtitle');
    const backBtn = document.getElementById('back-btn');

    if (!title || !subtitle || !backBtn) return;

    if (screenId === 'subject-screen') {
        title.innerText = "Study Portal"; subtitle.innerText = "Dashboard"; backBtn.classList.add('hidden-screen');
    } else if (screenId === 'chapter-screen') {
        title.innerText = escapeHTML(state.subject); subtitle.innerText = "Chapters"; backBtn.classList.remove('hidden-screen');
    } else if (screenId === 'assessment-screen') {
        title.innerText = escapeHTML(state.chapter); subtitle.innerText = "Assessments"; backBtn.classList.remove('hidden-screen');
    } else if (screenId === 'quiz-screen' || screenId === 'results-screen') {
        title.innerText = screenId === 'quiz-screen' ? "Assessment" : "Results";
        subtitle.innerText = escapeHTML(state.assessment); backBtn.classList.add('hidden-screen');
    } else if (screenId === 'mock-exam-screen') {
        title.innerText = "Past Papers"; subtitle.innerText = "Archive"; backBtn.classList.remove('hidden-screen');
    } else if (screenId === 'mock-exam-papers-screen') {
        title.innerText = "Past Papers"; subtitle.innerText = "Select Year"; backBtn.classList.remove('hidden-screen');
    }
}

// ==========================================
// HYBRID URL ROUTER NAVIGATOR
// ==========================================
export function navigateTo(screenId, pushHistory = true) {
    console.log(`🧭 Navigating to: ${screenId}`);
    
    // THE ROUTER: Update the browser URL silently without triggering a reload
    if (pushHistory && window.location.hash !== `#${screenId}`) {
        history.pushState(null, '', `#${screenId}`);
    }
    
    ['subject-screen', 'chapter-screen', 'assessment-screen', 'quiz-screen', 'results-screen', 'mock-exam-screen', 'mock-exam-papers-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden-screen'); el.classList.remove('screen-enter'); }
    });
    
    const targetEl = document.getElementById(screenId);
    if (targetEl) {
        targetEl.classList.remove('hidden-screen'); 
        void targetEl.offsetWidth; 
        targetEl.classList.add('screen-enter');
    }
    
    state.currentScreen = screenId;
    updateHeader(screenId);

    if(screenId !== 'quiz-screen') stopTimer();
    if(screenId === 'subject-screen') loadSubjects();
}

export function navigateBack() {
    window.history.back(); // Use the browser's native back system
}

// THE ROUTER: Listen for the user clicking the physical browser Back/Forward arrows
window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '') || 'subject-screen';
    navigateTo(hash, false); // false prevents infinite history loops
});