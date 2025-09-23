# UX Advice for Papanin

This document provides UX (User Experience) suggestions to improve the Papanin application.

## Landing Page (`+page.svelte`)

*   **Clarity of Call-to-Action:** The "Pelajari Lebih Lanjut" (Learn More) button in the hero section is good, but it could be more explicit. Consider changing it to "Lihat Fitur" (See Features) to be more direct.

## Sidebar (`Sidebar.svelte`)

*   **Language Consistency:** The button "Tambah Proyek" should be translated to the primary language of the application to maintain consistency.
*   **Visual Hierarchy:** To improve scannability, consider making the project links under each organization visually distinct from the organization name. This could be achieved by adding an icon, using a different font weight, or applying a subtle indentation.
*   **Active State:** When a user navigates to a specific project page, highlight the corresponding project in the sidebar to provide a clear visual cue of their current location.

## Dashboard (`(protected)/dashboard/+page.svelte`)

*   **Actionable Insights:** The "Tugas untuk Kamu" (Tasks for You) card could be more actionable. Instead of just displaying the total number of tasks, consider showing a list of high-priority tasks or tasks that are due soon.
*   **Specificity in Summaries:** The "Ringkasan Fokus" (Focus Summary) card is a bit vague. Make it more specific by highlighting overdue tasks or tasks that have been in the same status for an extended period.
*   **Enhanced Scannability:** The "Aktivitas Terbaru" (Recent Activities) list can be improved by adding icons or avatars next to each activity. This will make the list easier to scan and digest.

## Kanban Board (`KanbanBoard.svelte`)

*   **Drag-and-Drop Feedback:** When a user drags a task, provide a clear visual cue, such as a drop shadow or a change in background color, to indicate that the task is being moved.
*   **Prominent "View Task" Button:** The "View Task" button on each task card is a good feature, but it could be more prominent. Consider using a different color or adding an icon to make it stand out.
*   **Destructive Action Confirmation:** Deleting a status is a significant and destructive action. Instead of a simple confirmation dialog, consider implementing a more robust confirmation mechanism. For example, you could require the user to type the name of the status to confirm its deletion.

## General UX Suggestions

*   **Consistency:** Ensure that the language, terminology, and design patterns are consistent throughout the application.
*   **Empty States:** The application has good empty states, which is excellent for user guidance. Continue to apply this pattern to other areas of the application where it makes sense.
*   **Loading States:** The use of loading spinners is effective. Ensure that all asynchronous operations provide feedback to the user.
*   **Accessibility:** Continue to prioritize accessibility by using semantic HTML and ARIA attributes where appropriate.
