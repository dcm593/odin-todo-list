import "./styles.css";
import { appController } from "./modules/appController.js";
import { displayController } from "./ui/displayController.js";
import { createTodo } from "./modules/todo.js";

const project1 = appController.addProject("Test Project");
project1.addTodo(createTodo("Finish app", "Test the app a bit", "2024-12-31", "High", "Make sure it compiles when I run npx webpack serve in the command line, then check at localhost:8080 to see if the project and todo are rendered correctly."));

displayController.init();