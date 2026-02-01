# AGENT SKILLS DEFINITION

## Skill: bmad_plan_feature
**Description:** Initiates the B-MAD planning phase for a new requirement.
**Triggers:** When user asks for a "new feature", "module", or "architecture change".
**Action Instructions:**
1. Create a directory `.bmad/specs/`.
2. Generate a structured markdown file `[feature_name].spec.md` containing:
   - User Story
   - Acceptance Criteria
   - Technical Constraints
   - Pseudo-code Strategy
3. Stop and ask user for approval of the spec.

## Skill: bmad_validate_spec
**Description:** Ensures code aligns with the approved specification.
**Triggers:** Before writing actual code (Python/JS/Go) or when user says "Implement it".
**Action Instructions:**
1. Read the active `*.spec.md` file.
2. Create a checklist of files to be generated.
3. Verify that the proposed code satisfies the "Acceptance Criteria" from the spec.

## Skill: bmad_memory_log
**Description:** Writes a summary of the session to persistent memory to avoid context loss.
**Triggers:** At the end of a major task or when user says "Save progress".
**Action Instructions:**
1. Append a concise summary of what was achieved to `.bmad/work_log.md`.
2. List pending "Next Steps" for the next session.

## Skill: bmad_diagnose
**Description:** Structural debugging based on isolation.
**Triggers:** When an error occurs or user reports a bug.
**Action Instructions:**
1. Do not fix immediately.
2. First, write a reproduction test case.
3. Isolate the module causing the issue.
4. Propose 3 potential fixes ranked by risk.