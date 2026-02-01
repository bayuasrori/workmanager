# Public Board - JavaScript Functions Documentation

This document explains all the JavaScript/TypeScript functions used in the public board Kanban interface.

## Table of Contents

- [State Management](#state-management)
- [Drag & Drop Handlers](#drag--drop-handlers)
- [Task Operations](#task-operations)
- [Status Column Operations](#status-column-operations)
- [UI Helper Functions](#ui-helper-functions)

---

## State Management

The component uses Svelte 5's reactive state system with the following key state variables:

### State Variables

```typescript
// Board data
let board = $state(data.board);              // Contains tasks and statuses
const boardSlug = $derived(board.slug ?? ''); // Ensures slug is never null
let taskStatuses = $state(data.board.taskStatuses);
let kanbanKey = $state(0);                     // Forces re-render when incremented

// Form states
let showCreateStatus = $state(false);          // Toggle create status form
let newStatusName = $state('');               // New status name input
let showCreateTask = $state(false);            // Toggle create task form
let newTaskName = $state('');                 // New task name input
let newTaskDescription = $state('');          // New task description input
let creatingStatusId = $state('');            // ID of status being created in
let editingTaskId = $state<string | null>(null); // ID of task being edited
let editTaskName = $state('');                // Edit task name input
let editTaskDescription = $state('');         // Edit task description input
let isCreatingTask = $state(false);           // Loading state for task creation

// Drag & Drop state
let statusDragSourceId = $state<string | null>(null); // Status being dragged
```

---

## Drag & Drop Handlers

These functions handle drag and drop operations for both tasks and status columns.

### `dragStart(event, taskId)`

**Purpose:** Initiates drag operation for a task card.

**Parameters:**
- `event` (DragEvent): The drag event object
- `taskId` (string): The ID of the task being dragged

**Behavior:**
- Sets drag data with task ID
- Sets the drag type for identification
- Configures visual feedback (move effect)

```typescript
function dragStart(event: DragEvent, taskId: string) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.setData(TASK_DRAG_TYPE, taskId);
    event.dataTransfer.effectAllowed = 'move';
  }
}
```

---

### `allowDrop(event)`

**Purpose:** Prevents default browser behavior to allow dropping.

**Parameters:**
- `event` (DragEvent): The drag event object

**Behavior:**
- Calls `preventDefault()` to enable drop zone

```typescript
function allowDrop(event: DragEvent) {
  event.preventDefault();
}
```

---

### `dragEnter(event)`

**Purpose:** Prevents default behavior when dragging over a drop zone.

**Parameters:**
- `event` (DragEvent): The drag event object

**Behavior:**
- Calls `preventDefault()` to indicate drop zone acceptance

```typescript
function dragEnter(event: DragEvent) {
  event.preventDefault();
}
```

---

### `drop(event, newStatusId)`

**Purpose:** Handles dropping a task onto a status column.

**Parameters:**
- `event` (DragEvent): The drop event object
- `newStatusId` (string): The ID of the target status column

**Behavior:**
- **Optimistic Update:** Immediately updates UI to show task in new column
- **Remote Call:** Persists the change using `updateTaskStatus` remote function
- **Error Recovery:** Reverts to original state if the API call fails

```typescript
async function drop(event: DragEvent, newStatusId: string) {
  event.preventDefault();
  const transfer = event.dataTransfer;
  
  // Return early if dragging a status column, not a task
  if (transfer && hasStatusDrag(event)) {
    return;
  }
  
  const taskId = transfer?.getData(TASK_DRAG_TYPE) || transfer?.getData('text/plain');
  
  if (taskId) {
    // OPTIMISTIC UPDATE: Update UI immediately
    const taskToUpdate = board.tasks.find((t) => t.id === taskId);
    let oldStatusId: string | null | undefined;
    
    if (taskToUpdate) {
      oldStatusId = taskToUpdate.statusId;
      taskToUpdate.statusId = newStatusId;
      board.tasks = [...board.tasks];  // Trigger reactivity
      kanbanKey += 1;                   // Force re-render
    }

    try {
      // PERSIST CHANGE: Call remote function
      await updateTaskStatus({
        taskId,
        newStatusId
      });
    } catch {
      // ERROR RECOVERY: Revert optimistic update
      if (taskToUpdate && oldStatusId != null) {
        taskToUpdate.statusId = oldStatusId;
        board.tasks = [...board.tasks];
        kanbanKey += 1;
      }
    }
  }
}
```

**Key Features:**
- ✅ Instant visual feedback (optimistic updates)
- ✅ Graceful error handling
- ✅ Automatic rollback on failure

---

### `statusDragStart(event, statusId)`

**Purpose:** Initiates drag operation for a status column.

**Parameters:**
- `event` (DragEvent): The drag event object
- `statusId` (string): The ID of the status column being dragged

**Behavior:**
- Sets the source status ID for tracking
- Configures drag data
- Stops event propagation to prevent task drag interference

```typescript
function statusDragStart(event: DragEvent, statusId: string) {
  statusDragSourceId = statusId;
  
  if (event.dataTransfer) {
    event.dataTransfer.setData(STATUS_DRAG_TYPE, statusId);
    event.dataTransfer.setData('text/plain', statusId);
    event.dataTransfer.effectAllowed = 'move';
  }
  
  event.stopPropagation();  // Prevent bubbling to task drag handlers
}
```

---

### `statusDragEnd()`

**Purpose:** Cleans up state after status drag operation ends.

**Parameters:** None

**Behavior:**
- Resets `statusDragSourceId` to null

```typescript
function statusDragEnd() {
  statusDragSourceId = null;
}
```

---

### `statusDragOver(event, targetStatusId)`

**Purpose:** Determines if a status column can be dropped onto another.

**Parameters:**
- `event` (DragEvent): The drag event object
- `targetStatusId` (string): The ID of the potential drop target

**Behavior:**
- Returns early if not dragging a status
- Returns early if dragging onto self
- Allows drop and sets visual feedback

```typescript
function statusDragOver(event: DragEvent, targetStatusId: string) {
  if (!hasStatusDrag(event)) {
    return;  // Not dragging a status
  }
  
  if (!statusDragSourceId || statusDragSourceId === targetStatusId) {
    return;  // Can't drop on self
  }
  
  event.preventDefault();  // Allow drop
  event.dataTransfer.dropEffect = 'move';  // Visual feedback
}
```

---

### `statusDrop(event, targetStatusId)`

**Purpose:** Handles dropping a status column to reorder columns.

**Parameters:**
- `event` (DragEvent): The drop event object
- `targetStatusId` (string): The ID of the target position

**Behavior:**
- **Optimistic Update:** Reorders status array immediately
- **Remote Call:** Persists new order via `reorderStatuses` remote function
- **Error Recovery:** Reverts to original order if API fails

```typescript
async function statusDrop(event: DragEvent, targetStatusId: string) {
  if (!hasStatusDrag(event)) {
    return;
  }
  
  event.preventDefault();
  const draggedId = event.dataTransfer?.getData(STATUS_DRAG_TYPE) || statusDragSourceId;
  
  if (!draggedId || draggedId === targetStatusId) {
    return;  // Invalid drop target
  }
  
  // OPTIMISTIC UPDATE: Reorder array
  const currentStatuses = [...taskStatuses];
  const fromIndex = currentStatuses.findIndex((status) => status.id === draggedId);
  const toIndex = currentStatuses.findIndex((status) => status.id === targetStatusId);
  
  if (fromIndex === -1 || toIndex === -1) return;
  
  const previous = [...currentStatuses];
  const [moved] = currentStatuses.splice(fromIndex, 1);  // Remove from old position
  currentStatuses.splice(toIndex, 0, moved);          // Insert at new position
  
  taskStatuses = currentStatuses;
  statusDragEnd();
  
  try {
    // PERSIST CHANGE: Save new order
    await reorderStatuses({
      slug: boardSlug,
      orderedIds: currentStatuses.map((s) => s.id)
    });
  } catch {
    // ERROR RECOVERY: Revert to original order
    taskStatuses = previous;
  }
}
```

**Key Features:**
- ✅ Smooth visual reordering
- ✅ Persists order across sessions
- ✅ Automatic rollback on failure

---

## Task Operations

Functions for creating, editing, and deleting tasks.

### `startCreateTaskForStatus(statusId)`

**Purpose:** Opens the task creation form for a specific status column.

**Parameters:**
- `statusId` (string): The ID of the status column to create task in

**Behavior:**
- Sets `creatingStatusId` to the specified column
- Clears form inputs (name and description)

```typescript
function startCreateTaskForStatus(statusId: string) {
  creatingStatusId = statusId;
  newTaskName = '';
  newTaskDescription = '';
}
```

---

### `cancelCreateTask()`

**Purpose:** Closes the task creation form and resets inputs.

**Parameters:** None

**Behavior:**
- Resets `creatingStatusId` to empty string
- Clears all form input fields

```typescript
function cancelCreateTask() {
  creatingStatusId = '';
  newTaskName = '';
  newTaskDescription = '';
}
```

---

### `handleCreateTask()`

**Purpose:** Creates a new task in the specified status column.

**Parameters:** None (uses component state)

**Behavior:**
- **Validation:** Checks if name is provided and which status to use
- **Loading State:** Sets `isCreatingTask` to true during operation
- **Remote Call:** Creates task via `createTask` remote function
- **Data Refresh:** Reloads board data to get new task
- **Form Reset:** Clears form and closes creation state on success

```typescript
async function handleCreateTask() {
  // VALIDATION: Ensure name and status are provided
  if (!newTaskName.trim() || isCreatingTask || !creatingStatusId) return;

  isCreatingTask = true;  // Show loading state

  try {
    // CREATE TASK: Call remote function
    await createTask({
      slug: boardSlug,
      name: newTaskName.trim(),
      description: newTaskDescription.trim() || undefined,
      statusId: creatingStatusId
    });

    // REFRESH DATA: Reload board to get new task
    const result = await getBoard({ slug: boardSlug });
    board = result.board;
    taskStatuses = result.board.taskStatuses;
    kanbanKey += 1;
    
    // CLEAN UP: Clear form and close
    cancelCreateTask();
  } catch (error) {
    console.error('Failed to create task', error);
  } finally {
    isCreatingTask = false;  // Always clear loading state
  }
}
```

**Key Features:**
- ✅ Input validation
- ✅ Loading indicator
- ✅ Automatic data refresh
- ✅ Form cleanup

---

### `startEditTask(taskId, name, description)`

**Purpose:** Opens task editing mode with current values pre-filled.

**Parameters:**
- `taskId` (string): The ID of the task to edit
- `name` (string): Current task name
- `description` (string | null): Current task description

**Behavior:**
- Sets `editingTaskId` to track which task is being edited
- Populates form inputs with current values
- Converts null description to empty string

```typescript
function startEditTask(taskId: string, name: string, description: string | null) {
  editingTaskId = taskId;
  editTaskName = name;
  editTaskDescription = description || '';  // Handle null case
}
```

---

### `cancelEditTask()`

**Purpose:** Closes task editing mode and clears inputs.

**Parameters:** None

**Behavior:**
- Resets `editingTaskId` to null
- Clears all edit form inputs

```typescript
function cancelEditTask() {
  editingTaskId = null;
  editTaskName = '';
  editTaskDescription = '';
}
```

---

### `handleUpdateTask(taskId)`

**Purpose:** Updates an existing task's name and/or description.

**Parameters:**
- `taskId` (string): The ID of the task to update

**Behavior:**
- **Validation:** Ensures task name is not empty
- **Remote Call:** Updates task via `updateTask` remote function
- **Data Refresh:** Reloads board to get updated task data
- **Form Reset:** Closes edit mode on success

```typescript
async function handleUpdateTask(taskId: string) {
  // VALIDATION: Ensure name is not empty
  if (!editTaskName.trim()) return;

  try {
    // UPDATE TASK: Call remote function
    await updateTask({
      taskId,
      name: editTaskName.trim(),
      description: editTaskDescription.trim() || undefined
    });

    // REFRESH DATA: Reload board to get updated task
    const result = await getBoard({ slug: boardSlug });
    board = result.board;
    taskStatuses = result.board.taskStatuses;
    kanbanKey += 1;
    
    // CLEAN UP: Close edit mode
    cancelEditTask();
  } catch (error) {
    console.error('Failed to update task', error);
  }
}
```

---

## Status Column Operations

Functions for managing status columns.

### `handleCreateStatus()`

**Purpose:** Creates a new status column.

**Parameters:** None (uses component state)

**Behavior:**
- **Validation:** Checks if status name is provided
- **Remote Call:** Creates status via `createStatus` remote function
- **Data Refresh:** Reloads board to get new status
- **Form Reset:** Clears form and hides create panel on success

```typescript
async function handleCreateStatus() {
  // VALIDATION: Ensure name is provided
  if (!newStatusName.trim()) return;

  try {
    // CREATE STATUS: Call remote function
    await createStatus({
      slug: boardSlug,
      name: newStatusName.trim()
    });

    // REFRESH DATA: Reload board to get new status
    const result = await getBoard({ slug: boardSlug });
    board = result.board;
    taskStatuses = result.board.taskStatuses;
    kanbanKey += 1;
    
    // CLEAN UP: Clear form and hide panel
    newStatusName = '';
    showCreateStatus = false;
  } catch {
    console.error('Failed to create status');
  }
}
```

---

### `handleDeleteStatus(statusId)`

**Purpose:** Deletes a status column and all its tasks.

**Parameters:**
- `statusId` (string): The ID of the status to delete

**Behavior:**
- **Confirmation:** Shows confirm dialog with task count warning
- **Optimistic Update:** Immediately removes status and its tasks from UI
- **State Backup:** Saves previous state for potential rollback
- **Remote Call:** Deletes status via `deleteStatus` remote function
- **Data Refresh:** Reloads board after successful deletion
- **Error Recovery:** Restores previous state if deletion fails

```typescript
async function handleDeleteStatus(statusId: string) {
  const status = taskStatuses.find((s) => s.id === statusId);
  if (!status) return;

  // COUNT TASKS: Get number of tasks in status
  const tasksInStatus = board.tasks.filter((task) => task.statusId === statusId);
  const taskCount = tasksInStatus.length;

  // CONFIRMATION: Warn user about task deletion
  const baseMessage = `Delete status "${status.name}"`;
  const confirmMessage =
    taskCount > 0
      ? `${baseMessage} and ${taskCount} task${taskCount === 1 ? '' : 's'}? This cannot be undone.`
      : `${baseMessage}? This cannot be undone.`;
  
  if (!confirm(confirmMessage)) return;

  // BACKUP STATE: Save for potential rollback
  const previousStatuses = taskStatuses;
  const previousTasks = board.tasks;
  const previousBoard = board;
  const previousCreatingStatusId = creatingStatusId;
  const previousEditingState = {
    id: editingTaskId,
    name: editTaskName,
    description: editTaskDescription
  };

  // OPTIMISTIC UPDATE: Remove status and tasks
  const updatedStatuses = previousStatuses.filter((s) => s.id !== statusId);
  const updatedTasks = previousTasks.filter((task) => task.statusId !== statusId);

  taskStatuses = updatedStatuses;
  board = { ...board, taskStatuses: updatedStatuses, tasks: updatedTasks };
  
  // CLEAN UP EDIT STATES: If editing a task that's being deleted
  if (creatingStatusId === statusId) {
    creatingStatusId = '';
  }
  if (editingTaskId && !updatedTasks.some((task) => task.id === editingTaskId)) {
    cancelEditTask();
  }
  
  kanbanKey += 1;

  try {
    // PERSIST DELETION: Call remote function
    await deleteStatus({
      slug: boardSlug,
      statusId
    });

    // REFRESH DATA: Reload board to get clean state
    const result = await getBoard({ slug: boardSlug });
    board = result.board;
    taskStatuses = result.board.taskStatuses;
    kanbanKey += 1;
  } catch (error) {
    console.error('Failed to delete status', error);
    
    // ERROR RECOVERY: Restore previous state
    taskStatuses = previousStatuses;
    board = { ...previousBoard, taskStatuses: previousStatuses, tasks: previousTasks };
    creatingStatusId = previousCreatingStatusId;
    editingTaskId = previousEditingState.id;
    editTaskName = previousEditingState.name;
    editTaskDescription = previousEditingState.description;
    kanbanKey += 1;
  }
}
```

**Key Features:**
- ✅ Clear confirmation dialog with task count
- ✅ Automatic cleanup of edit states
- ✅ Optimistic UI update
- ✅ Full state restoration on error

---

## UI Helper Functions

### `handleShare()`

**Purpose:** Shares the public board URL using native sharing or clipboard.

**Parameters:** None

**Behavior:**
- Checks if `navigator.share` is available (mobile devices)
- Uses native share API if available
- Falls back to clipboard copy for desktop

```typescript
function handleShare() {
  if (navigator.share) {
    // NATIVE SHARE: Use mobile share sheet
    navigator.share({
      url: window.location.href,
      title: board.name
    });
  } else {
    // CLIPBOARD FALLBACK: Copy to clipboard
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  }
}
```

**Key Features:**
- ✅ Progressive enhancement
- ✅ Mobile-friendly share sheet
- ✅ Desktop clipboard support

---

### `hasStatusDrag(event)`

**Purpose:** Detects if a status column is being dragged.

**Parameters:**
- `event` (DragEvent): The drag event object

**Returns:** `boolean` - True if dragging a status, false otherwise

**Behavior:**
- Checks drag data types for status-specific MIME type
- Handles browser compatibility issues with `contains()` method

```typescript
function hasStatusDrag(event: DragEvent) {
  const types = event.dataTransfer?.types;
  if (!types) return false;
  
  // Try to use contains() method (modern browsers)
  const candidate = types as unknown as DOMStringList & { contains?: (value: string) => boolean };
  if (typeof candidate.contains === 'function') {
    return candidate.contains(STATUS_DRAG_TYPE);
  }
  
  // FALLBACK: Iterate through types (older browsers)
  const iterable = types as unknown as Iterable<string>;
  return Array.from(iterable).includes(STATUS_DRAG_TYPE);
}
```

**Key Features:**
- ✅ Browser compatibility
- ✅ Reliable type detection

---

## Remote Functions Used

This component uses SvelteKit's remote functions for server communication:

### Query Functions

- **`getBoard({ slug })`**: Fetches board data including tasks and statuses

### Command Functions

- **`updateTaskStatus({ taskId, newStatusId })`**: Updates a task's status
- **`createStatus({ slug, name })`**: Creates a new status column
- **`createTask({ slug, name, description, statusId })`**: Creates a new task
- **`reorderStatuses({ slug, orderedIds })`**: Reorders status columns
- **`updateTask({ taskId, name, description })`**: Updates task details
- **`deleteTask(taskId)`**: Deletes a task
- **`deleteStatus({ slug, statusId })`**: Deletes a status column

All remote functions:
- ✅ Use **Valibot** for schema validation
- ✅ Only access **service layer** (not direct DB)
- ✅ Include **activity logging** for audit trails
- ✅ Handle errors gracefully

---

## Design Patterns

### 1. Optimistic Updates

Used in `drop()`, `statusDrop()`, and `handleDeleteStatus()`:

```typescript
// 1. Update UI immediately
const previous = [...items];
items = updatedItems;

try {
  // 2. Persist change
  await remoteFunction();
} catch {
  // 3. Revert on error
  items = previous;
}
```

**Benefits:**
- Instant visual feedback
- Better perceived performance
- Automatic error recovery

---

### 2. Reactive State Management

Uses Svelte 5's `$state()` and `$derived()` runes:

```typescript
let board = $state(data.board);              // Reactive state
const boardSlug = $derived(board.slug ?? '');  // Computed value

// Updating triggers reactivity
board.tasks = [...board.tasks];  // Re-renders components
```

**Benefits:**
- Clear reactivity model
- Type-safe state
- Fine-grained updates

---

### 3. Clean State Transitions

All form operations follow this pattern:

```typescript
async function handleOperation() {
  // 1. Validate
  if (!input.trim()) return;

  try {
    // 2. Perform operation
    await remoteFunction();
    
    // 3. Refresh data
    const result = await getBoard();
    board = result.board;
    
    // 4. Clean up
    cleanup();
  } catch (error) {
    // 5. Handle error
    console.error(error);
  }
}
```

**Benefits:**
- Consistent error handling
- Predictable state changes
- Easy to maintain

---

## Accessibility Features

- **Keyboard Navigation:** Tasks are keyboard-accessible
- **ARIA Labels:** Drag and drop includes proper ARIA attributes
- **Focus Management:** Form inputs auto-focus when opened
- **Screen Reader Support:** Status messages and confirm dialogs are accessible

---

## Browser Compatibility

- **Modern Browsers:** Full support for drag and drop
- **Legacy Browsers:** Fallbacks for `dataTransfer.types` access
- **Mobile:** Native share API support with clipboard fallback

---

## Performance Optimizations

1. **Minimized Re-renders:** Uses `kanbanKey` to force targeted re-renders only when needed
2. **Optimistic Updates:** Instant UI response without waiting for server
3. **Efficient Arrays:** Uses spread operator for immutable updates
4. **Debounced Inputs:** Form validation on trim/submit only

---

## Error Handling Strategy

All operations use consistent error handling:

```typescript
try {
  await operation();
  // Success: update UI
} catch (error) {
  // Error: log and notify
  console.error('Operation failed', error);
  // Optional: revert optimistic updates
}
```

**Benefits:**
- Consistent user experience
- Debuggable errors
- Graceful degradation

---

## Future Enhancements

Potential improvements to consider:

1. **Undo/Redo:** Add undo stack for optimistic updates
2. **Batch Operations:** Support bulk task moves/updates
3. **Offline Support:** Service worker for offline operation
4. **Animations:** Add smooth transition animations
5. **Keyboard Shortcuts:** Add keyboard controls for common actions
6. **Filters:** Add task filtering and search
7. **Sorting:** Add task sorting within columns
8. **Templates:** Add task templates for quick creation