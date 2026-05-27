import { appController } from "../modules/appController.js";
import { format } from "date-fns";
import { createTodo } from "../modules/todo.js";
import trashIcon from "../assets/images/trash-icon.png";

// globals
let currentProjectIndex = null;
let currentView = "dashboard";
let previousView = "dashboard";
const calendarOffsets = {};
let currentCalendarDate = new Date();
let currentSort = "priority-date"; // default sorting for dashboard
let currentFilter = "all"; // show all priorities by default
let isEditMode = false;


// Rendering sidebar
const renderProjects = () => {
    const projectsContainer = document.querySelector(".projects");
    projectsContainer.innerHTML = "";

    const allProjects = appController.getProjects().projects;

    allProjects.forEach((project, index) => {
        if (project.isCompleted() || isOverdue(project)) return; // skip completed & overdue projects in sidebar

        const projectElement = document.createElement("div");
        projectElement.textContent = project.name;

        projectElement.addEventListener("click", () => {
            openProject(index);
        });

        projectsContainer.appendChild(projectElement);
    });
};



// Create project cards for dashboard view
const createProjectCard = (project, index) => {
    const card = document.createElement("div");
    card.classList.add("project-card");

    const summary = project.getSummary();

    const header = document.createElement("div");
    header.classList.add("project-card-header");

    const title = document.createElement("h3");
    title.textContent = project.name;

    const actions = document.createElement("div");
    actions.classList.add("project-actions");

    const completeBtn = document.createElement("button");
    completeBtn.textContent = project.isCompleted() ? "↩" : "✔";
    completeBtn.classList.add("complete-project-btn");

    completeBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const confirmed = confirm(`${project.isCompleted() ? `Move "${project.name}" back to active projects?` : `Mark "${project.name}" as completed?`}`);

        if (!confirmed) return;

        project.toggleCompleted();

        refreshUI();

        appController.saveProjects();
    });

    const deleteBtn = document.createElement("button");
    const deleteIcon = document.createElement("img");
    deleteIcon.src = trashIcon;
    deleteIcon.alt = "Delete";
    deleteIcon.classList.add("delete-icon");
    deleteBtn.appendChild(deleteIcon);
    deleteBtn.classList.add("delete-project-btn");

    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        
        const confirmed = confirm(`Delete "${project.name}" permanently?`);

        if (!confirmed) return;

        appController.deleteProject(index);
        appController.saveProjects();
        refreshUI();
    });

    actions.append(completeBtn, deleteBtn);
    header.append(title, actions);
    card.append(header);

    if (summary) {
        // Row container (todo title + priority + due date on same line)
        const infoRow = document.createElement("div");
        infoRow.classList.add("project-info-row");

        const todoTitle = document.createElement("span");
        todoTitle.classList.add("card-todo-title");
        todoTitle.textContent = summary.title;

        const priority = document.createElement("span");
        priority.classList.add("card-priority");
        priority.textContent = summary.priority;
        // Colour coding priority levels
        priority.classList.add(`priority-${summary.priority.toLowerCase()}`);

        const dueDate = document.createElement("span");
        dueDate.classList.add("card-due-date");
        dueDate.textContent = `${format(new Date(summary.dueDate), "MMM dd, yyyy '@' h:mma")}`;

        infoRow.append(todoTitle, priority, dueDate);

        // Description box
        const descriptionContainer = document.createElement("div");
        descriptionContainer.classList.add("card-description-box");

        const description = document.createElement("p");
        description.textContent = summary.description;

        descriptionContainer.appendChild(description);

        card.append(infoRow, descriptionContainer);
    }

    card.addEventListener("click", () => {
        openProject(index);
    });

    return card;
};

// Empty card for creating new projects in dashboard view
const createAddProjectCard = () => {
    const card = document.createElement("div");
    card.classList.add("project-card", "add-project-card");

    const plus = document.createElement("span");
    plus.classList.add("add-project-plus");
    plus.textContent = "+";

    const label = document.createElement("span");
    label.textContent = "Create New Project";

    card.append(plus, label);

    card.addEventListener("click", () => {
        const dialog = document.querySelector("dialog");
        const todoFormContainer = document.querySelector("#todo-form-container");
        dialog.showModal();
        todoFormContainer.innerHTML = "";
        todoFormContainer.appendChild(createTodoForm());
    });

    return card;
};

const getProcessedProjects = (projects) => {
    const priorityMap = { "High": 3, "Medium": 2, "Low": 1 };

    let result = [...projects];

    // Filtering
    if (currentFilter !== "all") {
        result = result.filter(project => {
           const summary = project.getSummary();
           if (!summary) return false;

           return summary.priority.toLowerCase() === currentFilter;
        });
    }

    // Sorting
    result.sort((a, b) => {
        const summaryA = a.getSummary();
        const summaryB = b.getSummary();

        if (!summaryA) return 1;
        if (!summaryB) return -1;

        if (currentSort === "priority-date") {
            const priorityDiff = priorityMap[summaryB.priority] - priorityMap[summaryA.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(summaryA.dueDate) - new Date(summaryB.dueDate);
        } else if (currentSort === "date") {
            return new Date(summaryA.dueDate) - new Date(summaryB.dueDate);
        } else if (currentSort === "priority") {
            return priorityMap[summaryB.priority] - priorityMap[summaryA.priority];
        }

        return 0;
    });

    return result;  
};

const isOverdue = (project) => {
    if (project.isCompleted()) return false;

    const now = new Date();

    return project.getTodos().todos.some(todo => {
        const data = todo.getData();
        if (!data.dueDate) return false;

        return new Date(data.dueDate) < now && !data.completed;
    });
};



// Rendering dashboard / projects grid view, and setup centralized view state management
const renderDashboard = () => {
    const grid = document.querySelector(".projects-grid");
    grid.innerHTML = "";

    const allProjects = appController.getProjects().projects;

    const processedProjects = getProcessedProjects(allProjects);

    processedProjects.forEach((project) => {
        if (project.isCompleted() || isOverdue(project)) return; // skip completed & overdue projects in dashboard view

        const index = allProjects.indexOf(project);

        grid.appendChild(createProjectCard(project, index));
    });

    grid.appendChild(createAddProjectCard());
};

const setView = (view) => {
    currentView = view;

    const dashboard = document.querySelector(".dashboard-view");
    const projectView = document.querySelector(".project-view");
    const caldendarView = document.querySelector(".calendar-view");

    dashboard.classList.add("hidden");
    projectView.classList.add("hidden");
    caldendarView.classList.add("hidden");

    switch (view) {
        case "project":
            projectView.classList.remove("hidden");
            break;
        case "calendar":
            caldendarView.classList.remove("hidden");
            break;
        default:
            dashboard.classList.remove("hidden");
    } 

    updateHeaderUI();
    refreshUI();
};

const updateHeaderUI = () => {
    const headerTitle = document.querySelector("#main-header-title");
    const headerSubtitle = document.querySelector("#main-header-subtitle");
    const controls = document.querySelector(".controls");
    const USER_NAME = "Damon"; // Placeholder for future user system (if I decide to implement one)

    switch (currentView) {
        case "dashboard":
            headerTitle.textContent = `Welcome, ${USER_NAME}`;
            headerSubtitle.textContent = "Let's get the day started";
            controls.classList.remove("hidden");
            break;
        case "completed":
            headerTitle.textContent = "Completed Projects";
            headerSubtitle.textContent = "Go ahead, admire your handiwork";
            controls.classList.add("hidden");
            break;
        case "calendar":
            headerTitle.textContent = "Your Calendar";
            headerSubtitle.textContent = "Visualize which fires to put out first";
            controls.classList.add("hidden");
            break;
        case "backlog":
            headerTitle.textContent = "Backlog";
            headerSubtitle.textContent = "These were lost in the sauce :(";
            controls.classList.add("hidden");
        case "project":
            controls.classList.add("hidden");
            break;
        default:
            controls.classList.add("hidden");
    }
};

const openProject = (index) => {
    currentProjectIndex = index;
    previousView = currentView;

    const backBtn = document.querySelector("#back-btn");
    if (previousView === "completed") {
        backBtn.textContent = "Return to Completed Projects";
    } else if (previousView === "calendar") {
        backBtn.textContent = "Return to Calendar";
    } else if (previousView === "backlog") {
        backBtn.textContent = "Return to Backlog";
    } else {
        backBtn.textContent = "Return to Dashboard";
    }

    setView("project");
};



/**
 * Builds a single todo list item element.
 * Toggling the checkbox immediately re-renders the list to move the item into/out of the Done section.
 */
const createTodoItem = (todo) => {
    const data = todo.getData();

    const item = document.createElement("div");
    item.classList.add("todo-item");

    const checkboxCol = document.createElement("div");
    checkboxCol.classList.add("todo-item-checkbox-col");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = data.completed;
    checkbox.addEventListener("change", () => {
        todo.toggleCompleted();
        appController.saveProjects();
        renderTodos(currentProjectIndex);

        const project = appController.getProjects().projects[currentProjectIndex];
        const todos = project.getTodos().todos;
        const allComplete = todos.length > 0 && todos.every(t => t.getData().completed);

        if (allComplete && !project.isCompleted()) {
            // Defer so the browser repaints the Done section before the prompt appears
            setTimeout(() => {
                const confirmed = confirm(`Looks like that is everything on the todo list — mark "${project.name}" as complete?`);
                if (confirmed) {
                    project.toggleCompleted();
                    appController.saveProjects();
                    setView(previousView);
                }
            }, 0);
        }
    });

    checkboxCol.appendChild(checkbox);

    const content = document.createElement("div");
    content.classList.add("todo-item-content");

    const header = document.createElement("div");
    header.classList.add("todo-item-header");

    const title = document.createElement("span");
    title.classList.add("todo-item-title");
    title.textContent = data.title;

    const priority = document.createElement("span");
    priority.classList.add("card-priority", `priority-${data.priority.toLowerCase()}`);
    priority.textContent = data.priority;

    header.append(title, priority);

    const description = document.createElement("p");
    description.textContent = data.description;

    const dueDate = document.createElement("time");
    dueDate.textContent = `Due: ${format(new Date(data.dueDate), "MMM dd, yyyy '@' h:mma")}`;

    const notes = document.createElement("textarea");
    notes.placeholder = "Notes";
    notes.value = data.notes;
    notes.addEventListener("input", (e) => {
        todo.setNotes(e.target.value);
        appController.saveProjects();
    });

    content.append(header, description, dueDate, notes);
    item.append(checkboxCol, content);
    return item;
};

/**
 * Renders the todo list for a project, split into active and completed (Done) sections.
 * Also syncs the complete-project button label to reflect current project state.
 */
const renderTodos = (projectIndex) => {
    const project = appController.getProjects().projects[projectIndex];

    document.querySelector(".project-title").textContent = project.name;
    document.querySelector("#complete-project-btn").textContent =
        project.isCompleted() ? "Revert to Active" : "Mark Complete";

    const list = document.querySelector(".todos-list");
    list.innerHTML = "";

    const active = [];
    const completed = [];

    project.getTodos().todos.forEach(todo => {
        (todo.getData().completed ? completed : active).push(todo);
    });

    active.forEach(todo => list.appendChild(createTodoItem(todo)));

    const doneLabel = document.createElement("div");
    doneLabel.classList.add("todos-done-label");
    doneLabel.textContent = "Done";
    list.appendChild(doneLabel);

    if (completed.length === 0) {
        const placeholder = document.createElement("div");
        placeholder.classList.add("todo-item-placeholder");
        placeholder.textContent = "No tasks complete yet — click the checkbox to mark a task as done";
        list.appendChild(placeholder);
    } else {
        completed.forEach(todo => {
            const item = createTodoItem(todo);
            item.classList.add("todo-item-completed");
            list.appendChild(item);
        });
    }
};



// Back to dashboard
const goBack = () => {
    setView(previousView);
};

/**
 * Creates a todo form row for use inside the project creation/edit dialog.
 * @param {object|null} existingData - If provided, pre-populates the row with existing todo values.
 *                                     Notes are stored on the row element so they survive the edit round-trip.
 */
const createTodoForm = (existingData = null) => {
    const row = document.createElement("div");
    row.classList.add("todo-form-row");

    const titleInput = document.createElement("input");
    titleInput.placeholder = "Todo Title";
    titleInput.classList.add("todo-title-input");

    const descriptionInput = document.createElement("textarea");
    descriptionInput.placeholder = "Description";
    descriptionInput.rows = 3;
    descriptionInput.classList.add("todo-description-input");

    const dateInput = document.createElement("input");
    dateInput.type = "datetime-local";
    dateInput.max = "9999-12-31T23:59";
    dateInput.classList.add("todo-date-input");
    dateInput.addEventListener("input", () => {
        if (!dateInput.value) return;
        const dashIndex = dateInput.value.indexOf("-");
        const year = parseInt(dateInput.value.slice(0, dashIndex), 10);
        if (year > 9999) {
            dateInput.value = "9999" + dateInput.value.slice(dashIndex);
        }
    });

    const prioritySelect = document.createElement("select");
    prioritySelect.classList.add("todo-priority-select");
    ["Low", "Medium", "High"].forEach(level => {
        const option = document.createElement("option");
        option.value = level;
        option.textContent = level;
        prioritySelect.appendChild(option);
    });

    if (existingData) {
        titleInput.value = existingData.title || "";
        descriptionInput.value = existingData.description || "";
        dateInput.value = existingData.dueDate || "";
        prioritySelect.value = existingData.priority || "Low";
        row.dataset.notes = existingData.notes || "";
    }

    row.append(titleInput, descriptionInput, dateInput, prioritySelect);

    // Remove button only appears in edit mode so users can delete individual todos
    if (isEditMode) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.classList.add("remove-todo-btn");
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => row.remove());
        row.appendChild(removeBtn);
    }

    return row;
};

document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();

    if (isEditMode) {
        const project = appController.getProjects().projects[currentProjectIndex];

        project.clearTodos();

        document.querySelectorAll(".todo-form-row").forEach(row => {
            const title = row.querySelector(".todo-title-input").value.trim();
            if (!title) return;

            const description = row.querySelector(".todo-description-input").value.trim();
            const dueDate = row.querySelector(".todo-date-input").value;
            const priority = row.querySelector(".todo-priority-select").value;
            const notes = row.dataset.notes || "";

            project.addTodo(createTodo(title, description, dueDate, priority, notes));
        });

        appController.saveProjects();
        resetDialog();
        document.querySelector("dialog").close();
        refreshUI();
        return;
    }

    const projectNameInput = document.querySelector("#project-name");
    const projectName = projectNameInput.value.trim();

    if (!projectName) return;

    const newProject = appController.addProject(projectName);

    const rows = document.querySelectorAll(".todo-form-row");
    rows.forEach(row => {
        const title = row.querySelector(".todo-title-input").value.trim();
        const description = row.querySelector(".todo-description-input").value.trim();
        const dueDate = row.querySelector(".todo-date-input").value;
        const priority = row.querySelector(".todo-priority-select").value;

        if (!title) return; // skip empty rows

        const todo = createTodo(title, description, dueDate, priority);
        newProject.addTodo(todo);
    });

    appController.saveProjects();

    e.target.reset();
    const todoFormContainer = document.querySelector("#todo-form-container");
    todoFormContainer.innerHTML = "";
    todoFormContainer.appendChild(createTodoForm());
    document.querySelector("#todo-form-container").innerHTML = "";
    document.querySelector("dialog").close();

    // Re-render UI
    refreshUI();
});



// Rendering for content inside the Complete tab
const renderCompletedProjects = () => {
    const grid = document.querySelector(".projects-grid");
    grid.innerHTML = "";

    const allProjects = appController.getProjects().projects;

    const processedProjects = getProcessedProjects(allProjects);

    processedProjects.forEach((project) => {
        if (!project.isCompleted()) return; // only show completed projects in this view

        const index = allProjects.indexOf(project);

        grid.appendChild(createProjectCard(project, index));
    });
};



// Rendering for content inside Caldendar tab
const renderCalendar = () => {
    const calendarBody = document.querySelector(".calendar-body");
    const calendarMonth = document.querySelector(".calendar-month");

    calendarBody.innerHTML = "";

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    calendarMonth.textContent = format(currentCalendarDate, "MMMM yyyy");

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay();

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    daysOfWeek.forEach(day => {
        const header = document.createElement("div");   
        header.classList.add("calendar-day-name");
        header.textContent = day;

        calendarBody.appendChild(header);
    });

    // Empty cells before/after current month
    const totalCells = 42; // 7 days * 6 rows

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    let currentDay = 1;
    let nextMonthDay = 1;

    for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
        const cell = document.createElement("div");
        cell.classList.add("calendar-cell");

        const dateLabel = document.createElement("div");
        dateLabel.classList.add("calendar-date");

        let displayDay;
        let displayMonth = month;
        let displayYear = year;
        let isCurrentMonth = true;

        // Previous month overflow
        if (cellIndex < startDay) {
            displayDay = prevMonthLastDay - startDay + cellIndex + 1;
            displayMonth = month - 1;

            if (displayMonth < 0) {
                displayMonth = 11;
                displayYear--;
            }

            isCurrentMonth = false;
        }

        // Current month
        else if (currentDay <= daysInMonth) {
            displayDay = currentDay;
            currentDay++;
        }

        // Next month overflow
        else {
            displayDay = nextMonthDay;

            displayMonth = month + 1;

            if (displayMonth > 11) {
                displayMonth = 0;
                displayYear++;
            }

            nextMonthDay++;
            isCurrentMonth = false;
        }

        dateLabel.textContent = displayDay;

        if (!isCurrentMonth) {
            cell.classList.add("other-month");

            cell.addEventListener("click", () => {
                currentCalendarDate = new Date(displayYear, displayMonth, 1);
                renderCalendar();
            });
        }

        cell.appendChild(dateLabel);

        const matchingItems = [];

        const allProjects = appController.getProjects().projects;

        allProjects.forEach((project, index) => {
            if (project.isCompleted()) return;

            project.getTodos().todos.forEach(todo => {
                const data = todo.getData();

                if (!data.dueDate) return;

                const dueDate = new Date(data.dueDate);

                if (dueDate.getFullYear() === displayYear && dueDate.getMonth() === displayMonth && dueDate.getDate() === displayDay) {
                    matchingItems.push({ project, index, todoData: data });
                }
            });
        });

        if (matchingItems.length > 0) {
            const offsetKey = `${displayYear}-${displayMonth}-${displayDay}`;

            if (!(offsetKey in calendarOffsets)) {
                calendarOffsets[offsetKey] = 0;
            }

            const currentOffset = calendarOffsets[offsetKey] % matchingItems.length;

            const currentItem = matchingItems[currentOffset];

            const projectDiv = document.createElement("div");
            projectDiv.classList.add("calendar-project");
            
            projectDiv.innerHTML = `
                <div class="calendar-todo-title">${currentItem.todoData.title}</div>
                <div class="calendar-priority">Priority: <span class="card-priority priority-${currentItem.todoData.priority.toLowerCase()}">${currentItem.todoData.priority}</span></div>
                <div class="calendar-project-name">Project: ${currentItem.project.name}</div>
            `;

            projectDiv.addEventListener("click", (e) => {
                e.stopPropagation();
                openProject(currentItem.index);
            });

            cell.appendChild(projectDiv);

            if (matchingItems.length > 1) {
                const upBtn = document.createElement("button");
                upBtn.textContent = "▲";
                upBtn.classList.add("calendar-arrow", "up");

                upBtn.addEventListener("click", (e) => {
                    e.stopPropagation();

                    calendarOffsets[offsetKey] = (calendarOffsets[offsetKey] - 1 + matchingItems.length) % matchingItems.length;
                    renderCalendar();
                });

                const downBtn = document.createElement("button");
                downBtn.textContent = "▼";
                downBtn.classList.add("calendar-arrow", "down");

                downBtn.addEventListener("click", (e) => {
                    e.stopPropagation();

                    calendarOffsets[offsetKey] = (calendarOffsets[offsetKey] + 1) % matchingItems.length;
                    renderCalendar();
                });

                cell.append(upBtn, downBtn);
            }
        }

        calendarBody.appendChild(cell);
    }
};

const goToPreviousMonth = () => {
    currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1);
    renderCalendar();
};

const goToNextMonth = () => {
    currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1);
    renderCalendar();
};

const renderBacklog = () => {
    const grid = document.querySelector(".projects-grid");
    grid.innerHTML = "";

    const allProjects = appController.getProjects().projects;

    const processedProjects = getProcessedProjects(allProjects);

    processedProjects.forEach((project) => {
        if (!isOverdue(project)) return; // only show overdue projects in backlog view

        const index = allProjects.indexOf(project);
        grid.appendChild(createProjectCard(project, index));
    });
};



// Centralized function to refresh the UI based on current view state
const refreshUI = () => {
    renderProjects();

    switch (currentView) {
        case "dashboard":
            renderDashboard();
            break;
        case "completed":
            renderCompletedProjects();
            break;
        case "calendar":
            renderCalendar();
            break;
        case "backlog":
            renderBacklog();
            break;
        case "project":
            renderTodos(currentProjectIndex);
            break;
    }
};



/**
 * Resets the dialog back to "create project" state after an edit or cancel.
 */
const resetDialog = () => {
    isEditMode = false;

    const firstLegend = document.querySelector("dialog legend");
    firstLegend.textContent = "New Project";

    const projectNameInput = document.querySelector("#project-name");
    projectNameInput.disabled = false;
    projectNameInput.value = "";

    document.querySelector("#submit-btn").textContent = "Create Project";

    const todoFormContainer = document.querySelector("#todo-form-container");
    todoFormContainer.innerHTML = "";
    todoFormContainer.appendChild(createTodoForm());
};

/**
 * Opens the dialog pre-populated with the current project's todos for editing.
 * Notes on each todo are stashed in the row's dataset so they survive the save round-trip.
 */
const openEditDialog = () => {
    const project = appController.getProjects().projects[currentProjectIndex];
    const dialog = document.querySelector("dialog");
    const todoFormContainer = document.querySelector("#todo-form-container");

    isEditMode = true;

    document.querySelector("dialog legend").textContent = "Edit Project";
    document.querySelector("#submit-btn").textContent = "Save Changes";

    const projectNameInput = document.querySelector("#project-name");
    projectNameInput.value = project.name;
    projectNameInput.disabled = true;

    todoFormContainer.innerHTML = "";
    project.getTodos().todos.forEach(todo => {
        todoFormContainer.appendChild(createTodoForm(todo.getData()));
    });

    dialog.showModal();
};

const init = () => {
    refreshUI();

    document.querySelector("#back-btn").addEventListener("click", goBack);

    // Dashboard button
    document.querySelector("#dashboard-btn").addEventListener("click", () => {
        setView("dashboard");
    });

    // Sort & filter buttons
    const sortBtn = document.querySelector("#sort-btn");
    const filterBtn = document.querySelector("#filter-btn");
    const sortPanel = document.querySelector("#sort-panel");
    const filterPanel = document.querySelector("#filter-panel");

    sortBtn.addEventListener("click", () => {
        sortPanel.classList.toggle("hidden");
        filterPanel.classList.add("hidden");
    });

    filterBtn.addEventListener("click", () => {
        filterPanel.classList.toggle("hidden");
        sortPanel.classList.add("hidden");
    });

    sortPanel.querySelectorAll("div").forEach(option => {
        option.addEventListener("click", () => {
            currentSort = option.dataset.sort;
            sortPanel.classList.add("hidden");
            refreshUI();
        });
    });

    filterPanel.querySelectorAll("div").forEach(option => {
        option.addEventListener("click", () => {
            currentFilter = option.dataset.filter;
            filterPanel.classList.add("hidden");
            refreshUI();
        });
    });

    // Close sort/filter panels when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".control-wrapper")) {
            sortPanel.classList.add("hidden");
            filterPanel.classList.add("hidden");
        }
    });

    // Calendar button
    document.querySelector("#calendar-btn").addEventListener("click", () => {
        currentCalendarDate = new Date(); // reset to current month when opening calendar
        setView("calendar");
    });

    // Calendar navigation buttons
    document.querySelector("#calendar-prev-btn").addEventListener("click", goToPreviousMonth);
    document.querySelector("#calendar-next-btn").addEventListener("click", goToNextMonth);

    // Completed projects button
    document.querySelector("#complete-btn").addEventListener("click", () => {
        setView("completed");
    });

    // Backlog button
    document.querySelector("#backlog-btn").addEventListener("click", () => {
        setView("backlog");
    });

    const dialog = document.querySelector("dialog");
    const todoFormContainer = document.querySelector("#todo-form-container");

    document.querySelector("#add-project-btn").addEventListener("click", () => {
        dialog.showModal();
        todoFormContainer.innerHTML = "";
        todoFormContainer.appendChild(createTodoForm());
    });

    document.querySelector("#close").addEventListener("click", () => {
        resetDialog();
        dialog.close();
    });

    document.querySelector("#cancel").addEventListener("click", () => {
        resetDialog();
        dialog.close();
    });

    dialog.addEventListener("click", (e) => {
        if (e.target === dialog) {
            resetDialog();
            dialog.close();
        }
    });

    document.querySelector("#edit-project-btn").addEventListener("click", () => {
        openEditDialog();
    });

    document.querySelector("#complete-project-btn").addEventListener("click", () => {
        const project = appController.getProjects().projects[currentProjectIndex];
        const isCompleted = project.isCompleted();
        const confirmed = confirm(
            isCompleted
                ? `Move "${project.name}" back to active projects?`
                : `Mark "${project.name}" as completed?`
        );
        if (!confirmed) return;
        project.toggleCompleted();
        appController.saveProjects();
        setView(previousView);
    });

    document.querySelector("#add-todo-btn").addEventListener("click", () => {
        todoFormContainer.appendChild(createTodoForm());
    });
};

export const displayController = { init, renderProjects, renderTodos, goBack };