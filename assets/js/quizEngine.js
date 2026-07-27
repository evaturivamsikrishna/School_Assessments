import { state, TIMER_MINUTES, saveProgress } from './state.js';
import { navigateTo, showToast, addXP, triggerConfetti, escapeHTML } from './uiControls.js';
import { dispatchTelemetry } from './telemetry.js';

// ==========================================
// QUIZ ENGINE LOGIC
// ==========================================
export function startQuiz(assessmentName) {
    console.log(`▶️ Starting Quiz: ${assessmentName}`);
    state.assessment = assessmentName; 
    state.questions = state.quizDataRaw[assessmentName];
    state.currentIndex = 0; 
    state.score = 0; 
    state.userAnswers = [];
    state.currentStreak = 0; 
    state.highestStreak = 0; 
    state.isQuizActive = true;
    
    document.getElementById('progress-bar').style.width = '0%';
    updateStreakUI(); 
    navigateTo('quiz-screen', false); 
    startTimer(); 
    renderQuestion();
}

export function retryAssessment() { 
    startQuiz(state.assessment); 
}

export function renderQuestion() {
    state.selectedOption = null;
    const q = state.questions[state.currentIndex];
    
    document.getElementById('progress-text').innerText = `Q ${state.currentIndex + 1}/${state.questions.length}`;
    const pct = (state.currentIndex / state.questions.length) * 100;
    document.getElementById('progress-bar').style.width = `${pct}%`;
    document.getElementById('question-text').innerText = escapeHTML(q.question);
    
    const container = document.getElementById('options-container'); 
    container.innerHTML = '';
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        const label = labels[index] || (index+1);
        
        btn.className = 'option-btn w-full text-left p-5 md:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-darkcard hover:border-brand-400 dark:hover:border-brand-500 transition-all font-semibold text-lg flex items-center gap-4 group focus:outline-none';
        btn.innerHTML = `<div class="w-10 h-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold transition-colors label-indicator">${label}</div><span class="flex-grow">${escapeHTML(opt)}</span>`;
        
        btn.onclick = () => {
            document.querySelectorAll('.option-btn').forEach(b => {
                b.classList.remove('option-selected', 'border-brand-500'); 
                b.classList.add('border-slate-200', 'dark:border-slate-700');
                const indicator = b.querySelector('.label-indicator');
                indicator.classList.remove('bg-brand-500', 'text-white'); 
                indicator.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-500', 'dark:text-slate-400');
            });
            btn.classList.add('option-selected', 'border-brand-500'); 
            btn.classList.remove('border-slate-200', 'dark:border-slate-700');
            const indicator = btn.querySelector('.label-indicator');
            indicator.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-500', 'dark:text-slate-400'); 
            indicator.classList.add('bg-brand-500', 'text-white');
            state.selectedOption = opt;
        };
        container.appendChild(btn);
    });
    
    const nextBtn = document.getElementById('next-btn');
    if(state.currentIndex === state.questions.length - 1) {
        nextBtn.innerHTML = 'Submit Assessment <i class="fa-solid fa-flag-checkered ml-2"></i>';
        nextBtn.className = 'bg-emerald-600 hover:bg-emerald-500 text-white w-full sm:w-auto px-12 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/30 transform hover:-translate-y-1 active:translate-y-0 text-lg';
    } else {
        nextBtn.innerHTML = 'Next Question <i class="fa-solid fa-arrow-right ml-2"></i>';
        nextBtn.className = 'bg-brand-600 hover:bg-brand-500 text-white w-full sm:w-auto px-12 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-brand-500/30 transform hover:-translate-y-1 active:translate-y-0 text-lg';
    }
}

export function updateStreakUI() {
    const streakEl = document.getElementById('streak-display');
    streakEl.innerHTML = `<i class="fa-solid fa-fire text-orange-500 mr-1"></i> Streak: ${state.currentStreak}`;
    if (state.currentStreak >= 2) {
        streakEl.classList.add('text-orange-600', 'dark:text-orange-400', 'streak-bump');
        setTimeout(() => streakEl.classList.remove('streak-bump'), 300);
    } else { 
        streakEl.classList.remove('text-orange-600', 'dark:text-orange-400'); 
    }
}

export function nextQuestion() {
    if (!state.selectedOption && state.timeRemaining > 0) {
        showToast("Please select an option to continue.", true);
        document.getElementById('options-container').animate([
            { transform: 'translateX(0)' }, 
            { transform: 'translateX(-10px)' }, 
            { transform: 'translateX(10px)' }, 
            { transform: 'translateX(0)' }
        ], { duration: 400 });
        return;
    }
    
    state.userAnswers.push(state.selectedOption);
    const q = state.questions[state.currentIndex];
    
    if (state.selectedOption === q.answer) {
        state.score++; 
        state.currentStreak++; 
        addXP(10 + (state.currentStreak * 2));
        if(state.currentStreak > state.highestStreak) state.highestStreak = state.currentStreak;
    } else { 
        state.currentStreak = 0; 
    }
    
    updateStreakUI();

    if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex++; 
        renderQuestion();
    } else { 
        finishQuiz(); 
    }
}

export function startTimer() {
    state.timeRemaining = TIMER_MINUTES * 60; 
    updateTimerUI();
    state.timerInterval = setInterval(() => {
        state.timeRemaining--; 
        updateTimerUI();
        if (state.timeRemaining <= 0) {
            stopTimer(); 
            showToast("Time's up! Auto-submitting...", true);
            state.selectedOption = null; 
            while(state.userAnswers.length < state.questions.length) nextQuestion();
        }
    }, 1000);
}

export function stopTimer() { 
    clearInterval(state.timerInterval); 
    state.isQuizActive = false; 
}

export function updateTimerUI() {
    const m = Math.floor(state.timeRemaining / 60).toString().padStart(2, '0');
    const s = (state.timeRemaining % 60).toString().padStart(2, '0');
    const display = document.getElementById('timer-text');
    const container = document.getElementById('timer-display');
    display.innerText = `${m}:${s}`;
    
    if (state.timeRemaining <= 60) {
        container.classList.add('bg-red-100', 'dark:bg-red-900/30', 'text-red-600', 'dark:text-red-400', 'border-red-300', 'dark:border-red-700', 'animate-pulse');
    } else {
        container.classList.remove('bg-red-100', 'dark:bg-red-900/30', 'text-red-600', 'dark:text-red-400', 'border-red-300', 'dark:border-red-700', 'animate-pulse');
    }
}

export function finishQuiz() {
    console.log("🏁 Assessment Finished. Triggering completion routines...");
    stopTimer(); 
    saveProgress(state.score, state.questions.length);

    // --- CALCULATE NEW TELEMETRY FIELDS ---
    const attemptKey = `studyPortal_attempts_${state.subject}_${state.chapter}_${state.assessment}`;
    let attemptCount = (parseInt(localStorage.getItem(attemptKey)) || 0) + 1;
    localStorage.setItem(attemptKey, attemptCount);
    
    const totalSecondsTaken = (TIMER_MINUTES * 60) - state.timeRemaining;
    const mTaken = Math.floor(totalSecondsTaken / 60).toString().padStart(2, '0');
    const sTaken = (totalSecondsTaken % 60).toString().padStart(2, '0');
    const timeTakenStr = `${mTaken}:${sTaken}`;

    let mistakes = [];
    state.questions.forEach((q, i) => {
        if(state.userAnswers[i] !== q.answer) {
            let userPick = state.userAnswers[i] ? state.userAnswers[i] : "Skipped/Timeout";
            mistakes.push(`Q${i+1}: ${q.question} | Picked: ${userPick} | Correct: ${q.answer}`);
        }
    });
    
    // Loophole safeguard: Prevent prompt window blowups
    let mistakesLog = "Perfect Score! No mistakes.";
    if (mistakes.length > 0) {
        if (mistakes.length > 5) {
            // Replaced hard line breaks with \n escape characters
            mistakesLog = mistakes.slice(0, 5).join("\n") + `\n...and ${mistakes.length - 5} other errors.`;
        } else {
            mistakesLog = mistakes.join("\n");
        }
    }
    
    dispatchTelemetry(state.subject, state.chapter, state.score, state.questions.length, attemptCount, mistakesLog, timeTakenStr);
    
    document.getElementById('progress-bar').style.width = '100%';
    navigateTo('results-screen', false);
    
    const pct = Math.round((state.score / state.questions.length) * 100);
    document.getElementById('score-percent').innerText = `${pct}%`;
    document.getElementById('score-fraction').innerText = `${state.score}/${state.questions.length}`;
    document.getElementById('highest-streak-display').innerText = state.highestStreak;
    
    const titleEl = document.getElementById('result-title');
    if (pct === 100) { 
        titleEl.innerText = "Perfect Score! 🌟"; 
        triggerConfetti(); 
    }
    else if (pct >= 80) { 
        titleEl.innerText = "Outstanding! 🏆"; 
        triggerConfetti(); 
    }
    else if (pct >= 60) { 
        titleEl.innerText = "Good Job! 👍"; 
    }
    else { 
        titleEl.innerText = "Keep Trying! 💪"; 
    }
    
    setTimeout(() => {
        const offset = 100 - pct;
        document.getElementById('score-ring').style.strokeDashoffset = offset;
        const ring = document.getElementById('score-ring');
        if(pct >= 80) ring.classList.replace('text-brand-500', 'text-emerald-500');
        else if(pct < 50) ring.classList.replace('text-brand-500', 'text-orange-500');
    }, 300);

    const review = document.getElementById('review-container'); 
    review.innerHTML = '';
    
    state.questions.forEach((q, i) => {
        const isCorrect = state.userAnswers[i] === q.answer;
        const ansStr = state.userAnswers[i] ? escapeHTML(state.userAnswers[i]) : "<span class='italic text-slate-400'>Skipped/Timeout</span>";
        
        review.innerHTML += `
            <div class="bg-white dark:bg-darkcard p-6 md:p-8 rounded-3xl border-2 shadow-sm ${isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'} relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10 text-6xl">
                    <i class="fa-solid ${isCorrect ? 'fa-check text-emerald-500' : 'fa-xmark text-red-500'}"></i>
                </div>
                <p class="font-bold text-lg leading-relaxed mb-4 relative z-10">
                    <span class="bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-lg text-sm mr-2">${i+1}</span> ${escapeHTML(q.question)}
                </p>
                <div class="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl relative z-10 border border-slate-100 dark:border-slate-800">
                    <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Your Answer:</p>
                    <p class="text-base font-bold ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">${ansStr}</p>
                    ${!isCorrect ? `<div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"><p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Correct Answer:</p><p class="text-base font-bold text-emerald-600 dark:text-emerald-400">${escapeHTML(q.answer)}</p></div>` : ''}
                </div>
            </div>`;
    });
}