import "./styles.css";
import { appController } from "./modules/appController.js";
import { displayController } from "./ui/displayController.js";
import { createTodo } from "./modules/todo.js";

appController.loadProjects();
displayController.init();