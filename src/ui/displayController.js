import { appController } from "../modules/appController.js";
import { format } from "date-fns";
import { createTodo } from "../modules/todo.js";
import { ca, is } from "date-fns/locale";

let currentProjectIndex = null;
let currentView = "dashboard";
let previousView = "dashboard";
const calendarOffsets = {};
let currentCalendarDate = new Date();


// Rendering sidebar
const renderProjects = () => {
    const projectsContainer = document.querySelector(".projects");
    projectsContainer.innerHTML = "";

    const allProjects = appController.getProjects().projects;

    allProjects.forEach((project, index) => {
        if (project.isCompleted()) return; // skip completed projects in sidebar

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
    deleteBtn.textContent = "🗑";
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
        const dueDate = document.createElement("p");
        dueDate.textContent = `Due: ${format(new Date(summary.dueDate), "MMM dd, yyyy '@' h:mma")}`;

        const priority = document.createElement("span");
        priority.textContent = `Priority: ${summary.priority}`;

        const description = document.createElement("p");
        description.textContent = summary.description;

        card.append(dueDate, priority, description);
    }

    card.addEventListener("click", () => {
        openProject(index);
    });

    return card;
};

const getSortedProjects = (projects) => {
    const priorityMap = { "High": 3, "Medium": 2, "Low": 1 };

    return [...projects].sort((a, b) => {
        const summaryA = a.getSummary();
        const summaryB = b.getSummary();

        // Projects without todos should be sorted to the end
        if (!summaryA) return 1;
        if (!summaryB) return -1;

        // Sort by priority
        const priorityDifference = priorityMap[summaryB.priority] - priorityMap[summaryA.priority];

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        // Date comparison (earliest due date first)
        return new Date(summaryA.dueDate) - new Date(summaryB.dueDate);
    });
};

// Rendering dashboard / projects grid view, and setup centralized view state management
const renderDashboard = () => {
    const grid = document.querySelector(".projects-grid");
    grid.innerHTML = "";

    const allProjects = appController.getProjects().projects;

    const sortedProjects = getSortedProjects(allProjects);

    sortedProjects.forEach((project) => {
        if (project.isCompleted()) return; // skip completed projects in dashboard view

        const index = allProjects.indexOf(project);

        grid.appendChild(createProjectCard(project, index));
    });
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

    refreshUI();
};

const openProject = (index) => {
    currentProjectIndex = index;
    previousView = currentView;

    const backBtn = document.querySelector("#back-btn");
    backBtn.textContent = previousView === "completed" ? "Return to Completed Projects" : "Return to Dashboard";

    setView("project");
};



// Rendering todos for a project
const renderTodos = (projectIndex) => {
    const project = appController.getProjects().projects[projectIndex];

    document.querySelector(".project-title").textContent = project.name;

    const list = document.querySelector(".todos-list");
    list.innerHTML = "";

    project.getTodos().todos.forEach((todo) => {
        const data = todo.getData();

        const item = document.createElement("div");
        item.classList.add("todo-item");

        const title = document.createElement("span");
        title.textContent = data.title;

        const description = document.createElement("p");
        description.textContent = data.description;

        const dueDate = document.createElement("time");
        dueDate.textContent = `Due: ${format(new Date(data.dueDate), "MMM dd, yyyy '@' h:mma")}`;

        const priority = document.createElement("span");
        priority.textContent = `Priority: ${data.priority}`;

        const notes = document.createElement("textarea");
        notes.value = data.notes;
        notes.addEventListener("input", (e) => {
            todo.setNotes(e.target.value);
        });

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = data.completed;
        checkbox.addEventListener("change", () => {
            todo.toggleCompleted();
        });

        item.append(title, description, dueDate, priority, notes, checkbox);
        list.appendChild(item);
    });
};



// Back to dashboard
const goBack = () => {
    setView(previousView);
};

const createTodoForm = () => {
    const row = document.createElement("div");
    row.classList.add("todo-form-row");
    
    const titleInput = document.createElement("input");
    titleInput.placeholder = "Todo Title";
    titleInput.classList.add("todo-title-input");

    const descriptionInput = document.createElement("input");
    descriptionInput.placeholder = "Description";
    descriptionInput.classList.add("todo-description-input");

    const dateInput = document.createElement("input");
    dateInput.type = "datetime-local";
    dateInput.classList.add("todo-date-input");

    const prioritySelect = document.createElement("select");
    prioritySelect.classList.add("todo-priority-select");
    ["Low", "Medium", "High"].forEach(level => {
        const option = document.createElement("option");
        option.value = level;
        option.textContent = level;
        prioritySelect.appendChild(option);
    });

    row.append(titleInput, descriptionInput, dateInput, prioritySelect);
    return row;
};

document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();

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

    const sortedProjects = getSortedProjects(allProjects);

    sortedProjects.forEach((project) => {
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
        }

        cell.appendChild(dateLabel);

        const matchingProjects = [];

        const allProjects = appController.getProjects().projects;

        allProjects.forEach((project, index) => {
            if (project.isCompleted()) return;

            const summary = project.getSummary();

            if (!summary?.dueDate) return;

            const dueDate = new Date(summary.dueDate);

            if (dueDate.getFullYear() === displayYear && dueDate.getMonth() === displayMonth && dueDate.getDate() === displayDay) {
                matchingProjects.push({ project, index, summary });
            }
        });

        if (matchingProjects.length > 0) {
            const offsetKey = `${displayYear}-${displayMonth}-${displayDay}`;

            if (!(offsetKey in calendarOffsets)) {
                calendarOffsets[offsetKey] = 0;
            }

            const currentOffset = calendarOffsets[offsetKey] % matchingProjects.length;

            const currentItem = matchingProjects[currentOffset];

            const projectDiv = document.createElement("div");
            projectDiv.classList.add("calendar-project");
            
            projectDiv.innerHTML = `<strong>${currentItem.project.name}</strong><div class="calendar-priority">Priority: ${currentItem.summary.priority}</div>`;

            projectDiv.addEventListener("click", () => {
                openProject(currentItem.index);
            });

            cell.appendChild(projectDiv);

            if (matchingProjects.length > 1) {
                const upBtn = document.createElement("button");
                upBtn.textContent = "▲";
                upBtn.classList.add("calendar-arrow", "up");

                upBtn.addEventListener("click", (e) => {
                    e.stopPropagation();

                    calendarOffsets[offsetKey] = (calendarOffsets[offsetKey] - 1 + matchingProjects.length) % matchingProjects.length;
                    renderCalendar();
                });

                const downBtn = document.createElement("button");
                downBtn.textContent = "▼";
                downBtn.classList.add("calendar-arrow", "down");

                downBtn.addEventListener("click", (e) => {
                    e.stopPropagation();

                    calendarOffsets[offsetKey] = (calendarOffsets[offsetKey] + 1) % matchingProjects.length;
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
        case "project":
            renderTodos(currentProjectIndex);
            break;
    }
};



const init = () => {
    refreshUI();

    document.querySelector("#back-btn").addEventListener("click", goBack);

    document.querySelector("#dashboard-btn").addEventListener("click", () => {
        setView("dashboard");
    });

    document.querySelector("#calendar-btn").addEventListener("click", () => {
        currentCalendarDate = new Date(); // reset to current month when opening calendar
        setView("calendar");
    });

    document.querySelector("#calendar-prev-btn").addEventListener("click", goToPreviousMonth);

    document.querySelector("#calendar-next-btn").addEventListener("click", goToNextMonth);

    document.querySelector("#complete-btn").addEventListener("click", () => {
        setView("completed");
    });

    const dialog = document.querySelector("dialog");
    const todoFormContainer = document.querySelector("#todo-form-container");

    document.querySelector("#add-project-btn").addEventListener("click", () => {
        dialog.showModal();
        todoFormContainer.innerHTML = "";
        todoFormContainer.appendChild(createTodoForm());
    });

    document.querySelector("#close").addEventListener("click", () => {
        dialog.close();
    });

    document.querySelector("#cancel").addEventListener("click", () => {
        dialog.close();
    });

    document.querySelector("#add-todo-btn").addEventListener("click", () => {
        todoFormContainer.appendChild(createTodoForm());
    });
};

export const displayController = { init, renderProjects, renderTodos, goBack };