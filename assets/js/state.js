// ==========================================
// CONFIGURATION & STATE
// ==========================================
export const TELEMETRY_CONFIG = {
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfSRiXP7IORGc2Ce39CqZrA_Ayt6grqFL7OfOYmLAyiyLhsFw/formResponse",
    entries: {
        name: "entry.795960842",    
        subject: "entry.842650238", 
        chapter: "entry.2033848128", 
        score: "entry.730375092",
        attempt: "entry.1368600616",
        mistakes: "entry.480544809", 
        timestamp: "entry.229426742", 
        timeTaken: "entry.160288449" 
    }
};

export const GITHUB_USERNAME = "evaturivamsikrishna"; 
export const REPO_NAME = "School_Assessments";
export const BASE_API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/quizzes`;
export const TIMER_MINUTES = 30;
export const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24;

export let state = {
    history: [], currentScreen: 'subject-screen',
    subject: "", chapter: "", assessment: "",
    quizDataRaw: {}, questions: [], userAnswers: [],
    currentIndex: 0, score: 0, selectedOption: null,
    isQuizActive: false, timerInterval: null, timeRemaining: 0,
    currentStreak: 0, highestStreak: 0, totalXP: 0
};

export const motivationQuotes = [
    "You don't have to be perfect today, just better than yesterday.",
    "Consistency beats intensity. Small steps every day.",
    "Mistakes are just proof that you are trying. Keep going.",
    "Focus on the step in front of you, not the whole staircase.",
    "Your future self is watching right now. Make them proud.",
    "Discipline is choosing between what you want now, and what you want most."
];

export function saveProgress(score, total) {
    const key = `studyPortal_${state.subject}_${state.chapter}_${state.assessment}`;
    const percentage = Math.round((score / total) * 100);
    const existingData = JSON.parse(localStorage.getItem(key));
    if (!existingData || existingData.percentage < percentage) {
        localStorage.setItem(key, JSON.stringify({ score, total, percentage }));
    }
}

export function getProgress(subject, chapter, assessment) {
    const key = `studyPortal_${subject}_${chapter}_${assessment}`;
    return JSON.parse(localStorage.getItem(key));
}
