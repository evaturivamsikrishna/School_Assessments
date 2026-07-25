Here is the complete, rewritten `CLAUDE.md` configured specifically for your project workspace, directory structure, and Claude CLI execution pipeline.

```markdown
# CLAUDE.md — CBSE Class 10 MCQ Assessment Generator

## System Context & Purpose
This repository manages the automated generation, tracking, and formatting of Class 10 CBSE Multiple Choice Question (MCQ) assessments. Claude CLI reads syllabus inputs from `Prompts/`, generates structured question sets, outputs them into `quizzes/`, and maintains generation status in target tracking JSON files.

---

## Workspace Layout & Mapping

```text
School_Assessments/
├── CLAUDE.md                  # Project instructions & guidelines
├── README.md                  # Project documentation
├── index.html                 # Frontend quiz application
├── Prompts/                   # Source syllabus & status tracking files
│   ├── Maths.json             # Mathematics syllabus breakdown
│   ├── Science.json           # Science syllabus breakdown
│   ├── Social.json            # Social Science syllabus breakdown
│   ├── Science_gen.json       # Tracking state for Science
│   └── Social_gen.json        # Tracking state for Social Science
└── quizzes/                   # Destination directory for generated quizzes
    ├── Mathematics/           # Chapter JSON files for Math
    ├── Science/               # Chapter JSON files for Science
    └── Social_Science/        # Chapter JSON files for Social Science

```

---

## Output Target JSON Schema

All output files inside `quizzes/<Subject>/<Chapter_Name>.json` must strictly follow this JSON schema:

```json
{
  "Assessment N": [
    {
      "question": "Clear and concise question text here...",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": "Option A"
    }
  ]
}

```

---

## Generation & Quality Rules

### 1. Assessment Composition (50 MCQs Total)

Every assessment batch must contain **exactly 50 questions** distributed across three cognitive tiers:

* **15 Foundational Questions**: Direct NCERT definitions, key terminology, basic formulas, and explicit factual recall.
* **20 Conceptual Questions**: Explanations, "why" and "how" reasoning, and core conceptual principles.
* **15 Analytical Questions**: Multi-step problem solving, scenario analysis, and practical applications.

### 2. Strict Data Validation Constraints

* **Exact Answer Match**: The value of `"answer"` MUST be a byte-for-byte exact match to one of the 4 strings inside the `"options"` array.
* **Option Count**: The `"options"` array must contain **exactly 4 distinct strings**. No duplicates allowed.
* **Quote Escaping**: Use single quotes (`'`) for internal terms, equations, or quotes within strings. Do not use unescaped double quotes inside values.
* **Syllabus Accuracy**: All concepts, terms, and correct answers must adhere strictly to the latest rationalized NCERT Class 10 curriculum.

---

## Standard Execution Workflow for Claude CLI

When processing a subtopic or chapter:

1. **Read Input**: Load the syllabus definition from `Prompts/<Subject>.json` and check the status in `Prompts/<Subject>_gen.json`.
2. **Generate Questions**: Produce the 50 MCQs conforming to the 15/20/15 cognitive tier distribution and all validation rules.
3. **Write Output**:
* Locate or create `quizzes/<Subject>/<Sanitized_Chapter_Name>.json`.
* Read existing chapter data if present, merge the new key (`"Assessment N"`), and write the updated JSON file.


4. **Update Status**:
* Set `"status": "completed"` and `"questions_count": 50` for the corresponding subtopic in `Prompts/<Subject>_gen.json`.



---

## Common Commands

### Generate Single Assessment

```bash
claude -p "Read Prompts/Science.json for Chapter 1. Generate 50 MCQs for Subtopic 1 per CLAUDE.md. Write output to quizzes/Science/Chemical_Reactions_and_Equations.json and update Prompts/Science_gen.json."

```

### Validate Generated Schema

```bash
claude -p "Inspect all JSON files in quizzes/ to ensure every 'answer' string exactly matches an item in its 'options' array and all 'options' arrays have length 4."

```

```

---

<ElicitationsGroup message="What would you like to do next?">
<Elicitation label="Generate a Python validation script for quizzes" query="Generate a Python validation script for quizzes" query_intent="CLICKABLE_SUGGESTION" />
<Elicitation label="Create a bash wrapper script for running Claude CLI" query="Create a bash wrapper script for running Claude CLI" query_intent="CLICKABLE_SUGGESTION" />
<Elicitation label="Create Maths_gen.json tracking state template" query="Create Maths_gen.json tracking state template" query_intent="CLICKABLE_SUGGESTION" />
</ElicitationsGroup>

```