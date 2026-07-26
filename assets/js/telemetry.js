
import { TELEMETRY_CONFIG } from './state.js';

// ==========================================
// ADVANCED DEBUG LOGGER
// ==========================================
export const appLogs = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function captureLog(level, ...args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    appLogs.push({ timestamp: new Date().toISOString(), level: level, message: msg });
    if(level === 'INFO') originalLog.apply(console, args);
    if(level === 'ERROR') originalError.apply(console, args);
    if(level === 'WARN') originalWarn.apply(console, args);
}

console.log = (...args) => captureLog('INFO', ...args);
console.error = (...args) => captureLog('ERROR', ...args);
console.warn = (...args) => captureLog('WARN', ...args);

export function downloadDebugLogs() {
    console.log("📥 Downloading debug_logs.json...");
    const blob = new Blob([JSON.stringify(appLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_portal_logs_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==========================================
// TELEMETRY SYSTEM (GOOGLE FORMS)
// ==========================================
export async function dispatchTelemetry(subject, chapter, score, total, attemptCount, mistakesLog, timeTakenStr) {
    console.log("📡 PREPARING TELEMETRY DISPATCH...");
    const user = localStorage.getItem('currentUser') || 'Anonymous';
    
    if (user.toLowerCase() === 'admin') {
        console.log("🛑 Telemetry bypassed for Admin account.");
        return;
    }

    const payload = {
        name: user,
        subject: subject,
        chapter: chapter,
        score: `${score}/${total}`,
        attempt: attemptCount.toString(),
        mistakes: mistakesLog,
        timestamp: new Date().toLocaleString(),
        timeTaken: timeTakenStr
    };
    console.log("📦 Payload compiled:", payload);

    if (!navigator.onLine) { 
        console.warn("⚠️ Browser is offline. Caching telemetry.");
        cacheTelemetry(payload); 
        return; 
    }
    
    await executeTelemetryPost(payload);
}

async function executeTelemetryPost(payload) {
    console.log("🚀 Executing POST request to Google Forms...");
    const formData = new FormData();
    formData.append(TELEMETRY_CONFIG.entries.name, payload.name);
    formData.append(TELEMETRY_CONFIG.entries.subject, payload.subject);
    formData.append(TELEMETRY_CONFIG.entries.chapter, payload.chapter);
    formData.append(TELEMETRY_CONFIG.entries.score, payload.score);
    formData.append(TELEMETRY_CONFIG.entries.attempt, payload.attempt);
    formData.append(TELEMETRY_CONFIG.entries.mistakes, payload.mistakes);
    formData.append(TELEMETRY_CONFIG.entries.timestamp, payload.timestamp);
    formData.append(TELEMETRY_CONFIG.entries.timeTaken, payload.timeTaken);

    try {
        const response = await fetch(TELEMETRY_CONFIG.formUrl, { method: 'POST', mode: 'no-cors', body: formData });
        console.log("✅ Fetch request completed (no-cors response received). Google should have data.");
    } catch (e) {
        console.error("❌ Fatal Fetch Error during Telemetry POST:", e);
        cacheTelemetry(payload);
    }
}

function cacheTelemetry(payload) {
    console.log("💾 Saving payload to localStorage pending queue.");
    const pending = JSON.parse(localStorage.getItem('pendingTelemetry') || '[]');
    pending.push(payload);
    localStorage.setItem('pendingTelemetry', JSON.stringify(pending));
}

export async function flushPendingTelemetry() {
    if (!navigator.onLine) return;
    const pending = JSON.parse(localStorage.getItem('pendingTelemetry') || '[]');
    if (pending.length === 0) return;
    
    console.log(`🧹 Flushing ${pending.length} pending telemetry records...`);
    for (const payload of pending) { await executeTelemetryPost(payload); }
    localStorage.removeItem('pendingTelemetry');
    console.log("🧹 Flush complete.");
}
