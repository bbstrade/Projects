# User Story
As a Project Manager, I want to have a detailed view of a project so that I can manage tasks, team members, guests, and communication effectively.

# Acceptance Criteria
1. **Project Overview**
    - Show Name, Description, Status, Priority, End Date.
    - Show Team Member count.
    - Back button to Project List.
    - Edit Project (requires EDIT_PROJECT permission).
    - Delete Project (requires DELETE_PROJECT permission, with confirmation).
2. **Statistics**
    - Real-time counters: Total Tasks, In Progress, Done, Overdue.
3. **Tab 1: Tasks**
    - Create/Edit/Delete tasks.
    - Grouping: None, By Assignee, By Label.
    - Auto-add assignee to team if not already a member.
    - Visualization: Title, Status, Priority, Assignee, Due Date.
4. **Tab 2: Team**
    - Add Member (Manual email input or Select from Users).
    - Auto-create TeamMember record if missing.
    - Remove Member (keeps history).
    - Show Avatar, Name, Email.
5. **Tab 3: Guests** (Conditional: `team.settings.allow_guest_users`)
    - Manage guests via `ProjectGuestManagement` component.
    - Permissions: view, comment, edit_tasks, create_tasks.
6. **Tab 4: Comments**
    - `CommentSection` component.
    - Add/Edit/Delete comments, Attach files, @mentions.
    - RLS: Only active team members.

# Technical Constraints
- Use Convex for backend (Schema, Mutations, Queries).
- Use Next.js for frontend (App Router).
- Styling: TailwindCSS (implied by "keep design").
- Components: `TaskForm`, `ProjectGuestManagement`, `CommentSection` must be created.
- Permissions: Check `role` in `teamMembers`.

# Pseudo-code Strategy
1. **Schema Update**: 
   - Add `projectComments` table (or unified `comments`).
   - Ensure `projects` has necessary fields.
2. **Backend**:
   - `convex/projects.ts`: `get`, `update`, `delete`, `getStats`.
   - `convex/tasks.ts`: `list`, `create`, `update`, `delete`.
   - `convex/teams.ts`: `addMember` (with user check), `removeMember`.
   - `convex/comments.ts`: `list`, `create`, `delete`.
3. **Frontend**:
   - `page.tsx` validates `projectId`.
   - `ProjectHeader` component.
   - Tabs (UI Component).
   - `TasksList` with `grouping` state.
   - `TaskForm` (Dialog).
   - `TeamManagement` component.
   - `GuestManagement` component.
   - `Comments` component.
