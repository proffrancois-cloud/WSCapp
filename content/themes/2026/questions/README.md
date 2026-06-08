# WSC 2026 Question Bank

This folder is the normalized question source for the 2026 theme.

- `question-bank.json` is the app-friendly source of truth: prompt, correct answer, distractors, feedback, source type, level, section links, and raw-content entry links live together.
- `question-bank.csv` is a generated review table for humans. Use it to audit wording, distractors, and feedback quickly.
- `sections/*/questions.json` still exists as a compatibility view during migration, but the runtime generator now prefers this central bank.

Current counts:

```json
{
  "uniqueQuestions": 396,
  "sectionPlacements": 396,
  "bySourceType": {
    "entry.quizQuestions": 214,
    "section.guideQuestions": 182
  }
}
```
