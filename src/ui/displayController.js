import { appController } from "../modules/appController";

const renderProjects = () => {
    const projectsContainer = document.querySelector(".projects");
    projectsContainer.innerHTML = "";

    appController.getProjects().projects.forEach((project, index) => {
        const projectElement = document.createElement("div");
        projectElement.textContent = project.name;

        projectElement.addEventListener("click", () => {
            renderTodos(index);
        });

        container.appendChild(projectElement);
    });
};

const renderTodos = (projectIndex) => {
    const todosContainer = document.querySelector(".todos");
    todosContainer.innerHTML = "";

    const project = appController.getProjects().projects[projectIndex];

    project.getTodos().todos.forEach((todo) => {
        const data = todo.getData();

        const wrapper = document.createElement("div");

        const title = document.createElement("span");
        title.textContent = data.title;

        const description = document.createElement("p");
        description.textContent = data.description;

        const dueDate = document.createElement("time");
        dueDate.textContent = `Due: ${data.dueDate}`;

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

        wrapper.append(title, description, dueDate, priority, notes, checkbox);
        todosContainer.appendChild(wrapper);
    });
};

const init = () => {
    renderProjects();
};

export const displayController = { init, renderProjects, renderTodos };