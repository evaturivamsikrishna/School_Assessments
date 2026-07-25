Here is a comprehensive project overview. You can use this directly as the `README.md` file for your GitHub repository, as a documentation guide, or as a blueprint to track your long-term goals for the platform.

---

# Project Overview: Serverless CBSE Assessment Engine

### 🎯 The Core Concept

The **Serverless CBSE Assessment Engine** is a lightweight, frontend-only web application designed to provide a comprehensive, distraction-free testing environment for the NCERT Class 10 syllabus.

Instead of relying on a heavy backend server or paying for database hosting, the platform uses a "serverless" architecture. It operates entirely in the browser and uses the public GitHub REST API as a free, dynamic database to fetch multiple-choice questions (MCQs) stored in JSON format.

### 🏗️ Technical Architecture

* **Frontend UI:** HTML5 and Tailwind CSS (via CDN). Features a responsive, 85% scaled viewport layout optimized for both desktop and tablet screens.
* **State Management:** Vanilla JavaScript. Handles routing, quiz logic, timers, and scoring without requiring heavy frameworks like React or Angular.
* **Database:** GitHub Repository (`contents/quizzes` directory). Acts as a static file server to deliver chapter-specific JSON data.
* **Data Persistence:** Browser `localStorage`. Saves the student's highest score securely on their own device, minimizing external data transmission.

### 🧠 The Content Strategy (The 500-Question Matrix)

The true power of the platform lies in its highly structured data generation. Rather than random questions, every chapter is subjected to a "500-Question Matrix":

1. **Micro-Targeting:** Every chapter is sliced into exactly 10 chronological sub-topics.
2. **The 50-Question Batch:** Each sub-topic receives a dedicated 50-question assessment.
3. **Cognitive Tiering:** Questions within each batch are strictly generated across three cognitive levels to prevent rote memorization:
* *Tier 1 (15 Qs):* Foundational Recall (Direct NCERT facts).
* *Tier 2 (20 Qs):* Conceptual Understanding (The "Why" and "How").
* *Tier 3 (15 Qs):* Analytical Application (Scenario-based problem solving).



### 🚀 Key Features

* **Dynamic Repository Fetching:** The UI builds its own menus by reading the GitHub folder structure in real-time. Adding a new subject or chapter is as simple as dropping a new JSON file into the repository—no code updates required.
* **Active Progress Tracking:** Features a dynamic top-bar progress indicator and a 30-minute countdown timer per assessment to simulate real exam pressure.
* **Persistent High Scores:** The dashboard reads local browser data to display green "Best Score" badges next to previously completed assessments.
* **Fail-Safes & Security:** Includes accidental-refresh blocking (`beforeunload`), XSS HTML sanitization for JSON text strings, and a confirmation modal for quitting active tests.
* **Instant Feedback Loop:** Post-assessment review screens instantly highlight the selected answer versus the correct answer, accompanied by a dynamic circular progress graph of the final score.

### 🗺️ Future Expansion Scope

As the platform matures, the following modular upgrades can be layered onto the existing architecture:

1. **Python Automation Pipeline:** Utilizing an LLM API (like Google Gemini) via a Python script to automatically generate, validate, and append the JSON question batches directly into the repository.
2. **Spaced Repetition Integration:** Upgrading the `localStorage` logic to flag assessments for a "Re-Test" if the score was below 70% or if more than 14 days have passed since the last attempt.
3. **Global Leaderboard:** Migrating from `localStorage` to a lightweight Backend-as-a-Service (BaaS) like Firebase to sync scores across multiple devices.