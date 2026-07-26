import { showToast, escapeHTML } from './uiControls.js';

const MANIFEST_URL = 'mock_papers/manifest.json';
const LOCK_DURATION_MS = 10800000; // 3 hours in milliseconds

/**
 * Helper to programmatically trigger a file download.
 * @param {string} url - The URL of the file to download.
 */
function triggerDownload(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop(); // Suggest a filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Fetches and renders the list of mock exams from the manifest file.
 */
export async function loadMockExams() {
    const container = document.getElementById('mock-exam-list');
    if (!container) return;
    container.innerHTML = '';

    try {
        const response = await fetch(MANIFEST_URL);
        if (!response.ok) throw new Error('Network response was not ok.');
        const exams = await response.json();

        exams.forEach(exam => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-darkcard border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col gap-4';
            card.innerHTML = `
                <div>
                    <p class="text-sm font-bold text-brand-500 uppercase tracking-widest">${escapeHTML(exam.year)}</p>
                    <h3 class="font-extrabold text-xl mt-1">${escapeHTML(exam.subject.replace(/_/g, ' '))}</h3>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 mt-auto">
                    <button onclick="downloadQP('${exam.id}', '${exam.qp_url}')" class="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-file-arrow-down"></i> Question Paper
                    </button>
                    <button onclick="downloadMS('${exam.id}', '${exam.ms_url}')" class="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                        <i class="fa-solid fa-key"></i> Marking Scheme
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Failed to load mock exams:", error);
        container.innerHTML = `<p class="col-span-full text-red-500">Error: Could not load mock exams manifest.</p>`;
    }
}

export function downloadQP(examId, url) {
    localStorage.setItem(`mock_exam_${examId}`, Date.now());
    triggerDownload(url);
    showToast('Question Paper download started!');
}

export function downloadMS(examId, url) {
    const startTime = localStorage.getItem(`mock_exam_${examId}`);
    if (!startTime) {
        return showToast("Please download the Question Paper first.", true);
    }
    const elapsedTime = Date.now() - parseInt(startTime, 10);
    if (elapsedTime < LOCK_DURATION_MS) {
        const minutesLeft = Math.ceil((LOCK_DURATION_MS - elapsedTime) / 60000);
        return showToast(`🔒 Locked! Unlocks in ${minutesLeft} mins`, true);
    }
    triggerDownload(url);
}