import { appController } from "../modules/appController.js";
import { format } from "date-fns";

let currentProjectIndex = null;

// Rendering sidebar
const renderProjects = () => {
    const projectsContainer = document.querySelector(".projects");
    projectsContainer.innerHTML = "";

    appController.getProjects().projects.forEach((project, index) => {
        const projectElement = document.createElement("div");
        projectElement.textContent = project.name;

        projectElement.addEventListener("click", () => {
            openProject(index);
        });

        projectsContainer.appendChild(projectElement);
    });
};

// Rendering dashboard / projects grid view
const renderDashboard = () => {
    const grid = document.querySelector(".projects-grid");
    grid.innerHTML = "";

    const projects = appController.getProjects().projects;

    projects.forEach((project, index) => {
        const card = document.createElement("div");
        card.classList.add("project-card");

        const summary = project.getSummary();

        const title = document.createElement("h3");
        title.textContent = project.name;

        card.appendChild(title);

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

        grid.appendChild(card);
    });
};

const openProject = (index) => {
    currentProjectIndex = index;

    const dashboard = document.querySelector(".dashboard-view");
    const projectView = document.querySelector(".project-view");

    dashboard.classList.add("hidden");
    projectView.classList.remove("hidden");

    renderTodos(index);
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
    document.querySelector(".dashboard-view").classList.remove("hidden");
    document.querySelector(".project-view").classList.add("hidden");
};

const init = () => {
    renderProjects(); // sidebar
    renderDashboard(); // project grid

    document.querySelector("#back-btn").addEventListener("click", goBack);
    document.querySelector("#dashboard-btn").addEventListener("click", goBack);
};

export const displayController = { init, renderProjects, renderTodos, goBack };