import { appController } from "../modules/appController.js";
import { format } from "date-fns";
import { createTodo } from "../modules/todo.js";

let currentProjectIndex = null;
let currentView = "dashboard";
let previousView = "dashboard";


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

        appController.saveProjects();

        refreshUI();
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

// Rendering dashboard / projects grid view
const renderDashboard = () => {
    const grid = document.querySelector(".projects-grid");
    grid.innerHTML = "";

    const allProjects = appController.getProjects().projects;

    allProjects.forEach((project, index) => {
        if (project.isCompleted()) return; // skip completed projects in dashboard view

        grid.appendChild(createProjectCard(project, index));
    });
};

const openProject = (index) => {
    currentProjectIndex = index;
    previousView = currentView;
    currentView = "project";

    const backBtn = document.querySelector("#back-btn");
    backBtn.textContent = previousView === "completed" ? "Return to Completed Projects" : "Return to Dashboard";

    const dashboard = document.querySelector(".dashboard-view");
    const projectView = document.querySelector(".project-view");

    dashboard.classList.add("hidden");
    projectView.classList.remove("hidden");

    refreshUI();
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
    currentView = previousView;

    document.querySelector(".dashboard-view").classList.remove("hidden");
    document.querySelector(".project-view").classList.add("hidden");

    refreshUI();
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

    allProjects.forEach((project, index) => {
        if (!project.isCompleted()) return; // only show completed projects in this view

        grid.appendChild(createProjectCard(project, index));
    });
};



const refreshUI = () => {
    renderProjects();

    switch (currentView) {
        case "dashboard":
            renderDashboard();
            break;
        case "completed":
            renderCompletedProjects();
            break;
        case "project":
            renderTodos(currentProjectIndex);
            break;
    }
};



const init = () => {
    refreshUI();

    document.querySelector("#back-btn").addEventListener("click", goBack);
    document.querySelector("#dashboard-btn").addEventListener("click", goBack);

    const openCompleteTab = () => {
        currentView = "completed";
        document.querySelector(".dashboard-view").classList.remove("hidden");
        document.querySelector(".project-view").classList.add("hidden");
        refreshUI();
    };

    document.querySelector("#complete-btn").addEventListener("click", openCompleteTab);

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