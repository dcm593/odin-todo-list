import { createProject } from "./project.js";
import { createTodo } from "./todo.js";
import { storage } from "./storage.js";

const projects = [];

const addProject = (name) => {
    const project = createProject(name);
    projects.push(project);
    return project;
};

const deleteProject = (index) => {
    projects.splice(index, 1);
};

const getProjects = () => ({ projects });

const loadProjects = () => {
    const storedProjects = storage.loadData();

    storedProjects.forEach(projData => {
        const project = createProject(projData.name);

        if (projData.completed) {
            project.toggleCompleted();
        }

        projData.todos.forEach(todoData => {
            const todo = createTodo(todoData.title, todoData.description, todoData.dueDate, todoData.priority, todoData.notes);

            if (todoData.completed) {
                todo.toggleCompleted();
            }

            project.addTodo(todo);
        });

        projects.push(project);
    });
};

const saveProjects = () => {
    const dataToStore = projects.map(project => ({
        name: project.name,
        completed: project.isCompleted(),
        todos: project.getTodos().todos.map(todo => todo.getData())
    }));

    storage.saveData(dataToStore);
};

export const appController = { addProject, getProjects, loadProjects, saveProjects, deleteProject };