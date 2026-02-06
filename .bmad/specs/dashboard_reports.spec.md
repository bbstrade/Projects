# Feature Specification: Dashboard & Reports Visualization

**Feature Name:** Dashboard & Reports Analytics
**Created:** 2026-02-06
**Status:** Draft

## User Story
As a user, I want to view a comprehensive and visually appealing Dashboard and Reports section so that I can track project progress, active tasks, and approval statuses with clear analytics and charts.

## Acceptance Criteria
1.  **Dashboard Page**:
    -   Displays key metrics (Total Projects, Tasks, Overdue, Approvals) with clear visual indicators.
    -   "Overview" tab shows Project Status distribution and Task Completion Trend.
    -   "Analytics" tab shows detailed numerical breakdowns.
    -   Layout is responsive and does not have overlaps (fixing any potential layout bugs).
    -   Charts are interactive or visually rich (using `recharts` or similar if available, or premium CSS).

2.  **Reports Page**:
    -   Displays high-level summary cards with progress bars/charts.
    -   Detailed tabs for Projects, Tasks, and Approvals.
    -   Visualizations correctly reflect the data from the backend.

3.  **Functionality**:
    -   All data is fetched dynamically from `convex/analytics.ts`.
    -   Loading states are smooth and aligned with the design.
    -   "Broken" elements (layout issues, misalignments) are resolved.

## Technical Constraints
-   Use existing Convex queries in `convex/analytics.ts`.
-   Use `recharts` for charting if installed, or high-quality CSS/SVG charts.
-   Maintain existing `lucide-react` icons.
-   Ensure compatibility with the "Settings" page fix (vertical tabs if necessary, or proper horizontal flow).

## Pseudo-code Strategy
1.  **Review & Fix Layouts**:
    -   Check `apps/web/app/(dashboard)/dashboard/page.tsx` and `apps/web/app/(dashboard)/reports/page.tsx` for layout issues similar to Settings.
    -   Ensure `Tabs` are correctly oriented or constrained to prevent overflow.

2.  **Enhance Visuals**:
    -   Integrate `recharts` for "Task Completion Trend" and "Project Status" instead of divs.
    -   Improve Card styling with gradients/shadows as per "premium" design guidelines.

3.  **Verify Logic**:
    -   Ensure `loading` states are handled correctly.
    -   Verify that empty states (no projects/tasks) look good.

4.  **Stitch Integration**:
    -   Use Stitch logic (via manual code or generation) to ensure the screens follow the design system.
