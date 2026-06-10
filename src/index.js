import "./styles.css";
import { appController } from "./modules/appController.js";
import { displayController } from "./ui/displayController.js";

appController.loadProjects();
displayController.init();
