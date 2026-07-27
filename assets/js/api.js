
import { BASE_API_URL, CACHE_EXPIRY_MS, GITHUB_USERNAME, REPO_NAME, state, getProgress } from './state.js';
import { showLoader, hideLoader, navigateTo, showToast, escapeHTML } from './uiControls.js';
import { startQuiz } from './quizEngine.js';

// ==========================================
// DATA FETCHING & NAVIGATION
// ==========================================
export async function fetchWithCache(url) {
    console.log(`🌐 Requesting data from: ${url}`);

    // DEV MODE: Force clear old mock data from cache so we can see the real LLM output
    if (url.includes('.json')) {
        localStorage.removeItem(`cache_${url}`);
    }

    const cached = localStorage.getItem(`cache_${url}`);
    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_EXPIRY_MS) return data;
        } catch (e) { console.error("Cache read error", e); }
    }

    console.log(`⬇️ Downloading fresh data from GitHub API...`);
    // Append a timestamp to the URL to bust GitHub's aggressive CDN cache
    const bypassUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();

    const res = await fetch(bypassUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    try { localStorage.setItem(`cache_${url}`, JSON.stringify({ data, timestamp: Date.now() })); } catch (e) { }
    return data;
}

export async function loadSubjects() {
    showLoader("Syncing Subjects...");
    try {
        const data = await fetchWithCache(BASE_API_URL);
        const folders = data.filter(item => item.type === 'dir');
        const list = document.getElementById('subject-list');
        list.innerHTML = folders.length ? '' : "<p class='col-span-full text-slate-500'>No subjects available.</p>";

        folders.forEach((folder, index) => {
            const btn = document.createElement('div');
            const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
            const color = colors[index % colors.length];

            btn.className = 'bg-white dark:bg-darkcard border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center gap-4 transform hover:-translate-y-1';
            btn.innerHTML = `
                <div class="w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-black/10 group-hover:scale-110 transition-transform">
                    ${escapeHTML(folder.name).charAt(0)}
                </div>
                <div>
                    <h3 class="font-extrabold text-lg group-hover:text-brand-500 transition-colors">${escapeHTML(folder.name)}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Tap to explore</p>
                </div>
            `;
            btn.onclick = () => {
                state.subject = folder.name;
                localStorage.setItem('studyPortal_subject', folder.name); // Drop breadcrumb
                loadChapters(folder.name);
            };
            list.appendChild(btn);
        });
    } catch (e) {
        console.error("❌ Failed to load subjects:", e);
        document.getElementById('subject-list').innerHTML = "<div class='col-span-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-6 rounded-2xl font-bold flex items-center gap-3'><i class='fa-solid fa-triangle-exclamation'></i> Network Error. Could not sync from GitHub.</div>";
    } finally { hideLoader(); }
}

export async function loadChapters(subjectName) {
    navigateTo('chapter-screen'); showLoader(`Loading Chapters...`);
    const list = document.getElementById('chapter-list'); list.innerHTML = '';

    try {
        const data = await fetchWithCache(`${BASE_API_URL}/${encodeURIComponent(subjectName)}`);
        const files = data.filter(item => item.name.endsWith('.json'));

        files.forEach((file, index) => {
            const btn = document.createElement('div');
            const cleanName = file.name.replace('.json', '').replace(/_/g, ' ');
            btn.className = 'bg-white dark:bg-darkcard border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-brand-400 dark:hover:border-brand-500 transition-all cursor-pointer flex flex-col justify-between group';
            btn.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 w-10 h-10 rounded-full flex items-center justify-center font-bold">${index + 1}</div>
                    <i class="fa-solid fa-arrow-right text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors -rotate-45 group-hover:rotate-0"></i>
                </div>
                <h3 class="font-bold text-lg leading-tight mb-2">${escapeHTML(cleanName)}</h3>
                <p class="text-xs font-bold text-brand-500 uppercase tracking-widest mt-auto">Assessments available</p>
            `;
            btn.onclick = () => {
                state.chapter = cleanName;
                localStorage.setItem('studyPortal_chapter', cleanName); // Drop breadcrumb
                localStorage.setItem('studyPortal_chapterUrl', file.download_url); // Drop breadcrumb
                fetchAssessments(file.download_url, cleanName);
            }; list.appendChild(btn);
        });
    } catch (e) { showToast("Error loading chapters.", true); } finally { hideLoader(); }
}

export async function fetchAssessments(url, chapterName) {
    showLoader(`Preparing Assessments...`);
    try {
        const data = await fetchWithCache(url);
        let normalizedData = Array.isArray(data) ? { "Assessment 1": data } : data;
        state.quizDataRaw = normalizedData;
        navigateTo('assessment-screen');
        const list = document.getElementById('assessment-list'); list.innerHTML = '';

        Object.keys(normalizedData).forEach((key) => {
            const btn = document.createElement('button');
            const qCount = normalizedData[key].length;
            const pastProgress = getProgress(state.subject, state.chapter, key);

            let progressUI = `<span class="text-xs font-bold text-slate-400 dark:text-slate-500">Not Attempted</span>`;
            if (pastProgress) {
                const isMastery = pastProgress.percentage >= 80;
                progressUI = `<div class="flex items-center gap-2"><span class="text-sm font-black ${isMastery ? 'text-green-500' : 'text-orange-500'}">${pastProgress.percentage}% Best</span>${isMastery ? '<i class="fa-solid fa-medal text-yellow-400"></i>' : ''}</div>`;
            }

            btn.className = 'w-full text-left bg-white dark:bg-darkcard border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group outline-none focus:ring-2 focus:ring-brand-500 flex flex-col';
            btn.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 p-3 rounded-2xl"><i class="fa-solid fa-file-pen text-xl"></i></div>
                    ${progressUI}
                </div>
                <h3 class="font-extrabold text-xl mb-1 group-hover:text-brand-500 transition-colors">${escapeHTML(key)}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">${qCount} Questions • ~${Math.ceil(qCount * 1.5)} Mins</p>
                <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-brand-600 dark:text-brand-400 font-bold text-sm">
                    Start Challenge <i class="fa-solid fa-play group-hover:translate-x-1 transition-transform"></i>
                </div>
            `;
            btn.onclick = () => startQuiz(key);
            list.appendChild(btn);
        });
    } catch (e) { showToast("Data format error.", true); } finally { hideLoader(); }
}


export async function loadAIInsights() {
    console.log("🤖 Attempting to fetch latest AI Tutor insights...");
    const insightsUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/analytics/student_insights.json?t=${Date.now()}`;
    try {
        const res = await fetch(insightsUrl);
        if (!res.ok) {
            console.log("⚠️ No AI insights file found yet.");
            return;
        }
        const data = await res.json();

        document.getElementById('ai-overall-health').innerText = `"${data.overall_health}"`;
        document.getElementById('ai-tutor-advice').innerText = data.ai_tutor_advice;

        const list = document.getElementById('ai-mistakes-list');
        list.innerHTML = '';

        if (data.specific_mistakes_breakdown && Array.isArray(data.specific_mistakes_breakdown)) {
            data.specific_mistakes_breakdown.forEach(mistake => {
                list.innerHTML += `
                    <li>
                        <strong class="text-slate-800 dark:text-slate-200">${escapeHTML(mistake.concept_area)}:</strong> 
                        ${escapeHTML(mistake.why_they_got_it_wrong)} <br>
                        <span class="text-emerald-600 dark:text-emerald-400 font-medium">↳ Action: ${escapeHTML(mistake.correction_strategy)}</span>
                    </li>`;
            });
        }

        document.getElementById('ai-insights-widget').classList.remove('hidden-screen');
        console.log("✅ AI Insights successfully loaded and rendered.");
    } catch (e) {
        console.log("❌ Error parsing AI insights:", e);
    }
}
