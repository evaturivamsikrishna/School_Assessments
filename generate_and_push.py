import os
import sys
import json
import argparse
import subprocess
import requests
import threading
import itertools
import time

# ==========================================
# CONFIGURATION
# ==========================================
OLLAMA_URL = "http://localhost:11434/api/chat"
DEFAULT_MODEL = "qwen3-coder:latest"

SUBJECT_MAP = {
    "Maths": {"syllabus": "Prompts/Maths.json", "gen": "Prompts/Maths_gen.json", "out_dir": "quizzes/Mathematics"},
    "Science": {"syllabus": "Prompts/Science.json", "gen": "Prompts/Science_gen.json", "out_dir": "quizzes/Science"},
    "Social": {"syllabus": "Prompts/Social.json", "gen": "Prompts/Social_gen.json", "out_dir": "quizzes/Social_Science"}
}

# ==========================================
# TERMINAL UI: ANIMATED SPINNER
# ==========================================
class Spinner:
    """A threaded CLI spinner to show background activity."""
    def __init__(self, message="Processing..."):
        # Modern braille spinner frames
        self.frames = itertools.cycle(['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'])
        self.message = message
        self.running = False
        self.thread = None

    def spin(self):
        while self.running:
            # \033[36m is cyan color, \033[0m resets color
            sys.stdout.write(f"\r\033[36m{next(self.frames)}\033[0m {self.message}")
            sys.stdout.flush()
            time.sleep(0.08)
        # Clear the line when finished
        sys.stdout.write('\r\033[K')

    def __enter__(self):
        self.running = True
        self.thread = threading.Thread(target=self.spin)
        self.thread.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.running = False
        if self.thread:
            self.thread.join()

# ==========================================
# GIT AUTOMATION
# ==========================================
def git_pull():
    print("🔄 Step 1: Syncing from remote repository...")
    try:
        with Spinner("Pulling latest changes from GitHub..."):
            subprocess.run(["git", "pull", "origin", "main"], check=True, capture_output=True)
        print("✅ Repository up to date.\n")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Git pull warning (continuing locally): {e.stderr.decode('utf-8').strip()}\n")

def git_push(commit_message):
    print("\n📦 Step 3: Staging and pushing changes to Git...")
    try:
        with Spinner("Uploading to GitHub..."):
            subprocess.run(["git", "add", "."], check=True, capture_output=True)
            subprocess.run(["git", "commit", "-m", commit_message], check=True, capture_output=True)
            subprocess.run(["git", "push", "origin", "main"], check=True, capture_output=True)
        print("🚀 Successfully pushed 1 assessment update to GitHub!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Git push failed. (Are there no changes to commit?)")

# ==========================================
# HELPER FUNCTIONS
# ==========================================
def sanitize_name(name):
    return name.replace(" ", "_").replace("/", "-").replace(":", "")

def clean_json_response(raw_text):
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()

# ==========================================
# GENERATION ENGINE (OLLAMA)
# ==========================================
def generate_single_assessment(subject, chapter, subtopic, assessment_num, model_name):
    prompt = f"""
    Act as an expert CBSE Class 10 teacher.
    Subject: {subject}
    Chapter: {chapter}
    Subtopic: {subtopic}
    
    Generate exactly 50 distinct MCQs:
    - 15 Foundational (NCERT facts/definitions)
    - 20 Conceptual (Why/How explanations)
    - 15 Analytical (Scenarios/Applications)
    
    CRITICAL OPTION RULES:
    1. Do NOT use single letters like ["A", "B", "C", "D"] for options.
    2. Write full, descriptive text choices for each option.
    3. The "answer" field MUST be the exact, word-for-word string matching one of the options in the array.
    
    EXACT JSON SCHEMA TO FOLLOW:
    {{
      "Assessment {assessment_num}": [
        {{
          "question": "Which of the following is a physical change?",
          "options": [
            "Melting of ice",
            "Rusting of iron",
            "Burning of paper",
            "Digestion of food"
          ],
          "answer": "Melting of ice"
        }}
      ]
    }}
    """
    
    print(f"🤖 Step 2: Generating Assessment {assessment_num} for [{subtopic}]")
    
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2}
    }

    try:
        # Wrap the blocking network request in our spinner
        with Spinner(f"Ollama ({model_name}) is thinking... (This may take 1-2 minutes)"):
            response = requests.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            
        raw_text = response.json()["message"]["content"]
        return json.loads(clean_json_response(raw_text))
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to Ollama on localhost:11434.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ JSON Parsing Error: {e}")
        return None

# ==========================================
# MAIN ROUTINE
# ==========================================
def main():
    parser = argparse.ArgumentParser(description="Single Assessment Generator & Git Sync")
    parser.add_argument("--subject", required=True, choices=["Maths", "Science", "Social"])
    parser.add_argument("--chapter", help="Specific Chapter Name (optional)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Ollama model to use")
    parser.add_argument("--dry-run", action="store_true", help="Run generation without saving or pushing")
    args = parser.parse_args()

    # Step 1: Pull remote changes first
    if not args.dry_run:
        git_pull()

    cfg = SUBJECT_MAP[args.subject]
    
    # Load trackers
    try:
        with open(cfg["gen"], "r", encoding="utf-8") as f:
            gen_data = json.load(f)
    except FileNotFoundError:
        gen_data = {}

    with open(cfg["syllabus"], "r", encoding="utf-8") as f:
        syllabus = json.load(f)

    if not args.dry_run:
        os.makedirs(cfg["out_dir"], exist_ok=True)

    assessment_generated = False

    # Find the FIRST pending subtopic and process ONLY that one
    for chapter in syllabus.get("chapters", []):
        if assessment_generated:
            break

        chap_name = chapter["chapter_name"]
        if args.chapter and args.chapter.lower() not in chap_name.lower():
            continue

        out_file = os.path.join(cfg["out_dir"], f"{sanitize_name(chap_name)}.json")
        
        try:
            with open(out_file, "r", encoding="utf-8") as f:
                chapter_json = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            chapter_json = {}

        subtopics = chapter.get("subtopics", [])
        for idx, subtopic in enumerate(subtopics, 1):
            assessment_key = f"Assessment {idx}"
            
            # Check if completed
            if chap_name in gen_data and assessment_key in gen_data[chap_name]:
                if gen_data[chap_name][assessment_key].get("status") == "completed":
                    continue

            # Found target subtopic -> Generate 1 Assessment
            batch = generate_single_assessment(args.subject, chap_name, subtopic, idx, args.model)
            
            if not batch:
                print("❌ Generation failed. Exiting pipeline.")
                sys.exit(1)

            if args.dry_run:
                print("✅ Generation Complete!")
                print("\n🧪 DRY RUN SUCCESS. 1 Assessment Output:")
                print(json.dumps(batch, indent=2))
                return

            print("✅ Generation Complete!")

            # Save Quiz JSON
            chapter_json.update(batch)
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(chapter_json, f, indent=4)

            # Update State Tracker
            if chap_name not in gen_data:
                gen_data[chap_name] = {}
            
            gen_data[chap_name][assessment_key] = {
                "subtopic": subtopic,
                "status": "completed",
                "questions_count": len(batch.get(assessment_key, []))
            }
            
            with open(cfg["gen"], "w", encoding="utf-8") as f:
                json.dump(gen_data, f, indent=4)

            print(f"✅ Saved [{assessment_key}] to {out_file}")
            
            # Step 3: Push to Git and exit loop
            git_push(f"Auto-gen: Added {args.subject} - {chap_name} ({assessment_key})")
            assessment_generated = True
            break

    if not assessment_generated and not args.dry_run:
        print("✨ No pending subtopics found. Everything is up to date!")

if __name__ == "__main__":
    main()