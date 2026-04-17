import { createProject } from "./project";

const projects = [];

const addProject = (name) => {
    const project = createProject(name);
    projects.push(project);
    return project;
};

const getProjects = () => ({ projects });

export const appController = { addProject, getProjects };