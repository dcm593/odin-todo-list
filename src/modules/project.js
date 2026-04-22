export const createProject = (name) => {
    const todos = [];

    const addTodo = (todo) => {
        todos.push(todo);
    };

    const getTodos = () => ({ todos });

    // Helper function to get a summary of the project (e.g. for dashboard cards)
    const getSummary = () => {
        if (todos.length === 0) return null;

        // Get the most urgent todo (highest priority, then earliest due date)
        const priorityMap = { "High": 3, "Medium": 2, "Low": 1 };
        const highestPriority = [...todos].sort((a, b) => {
            return priorityMap[b.getData().priority] - priorityMap[a.getData().priority];
        })[0].getData();

        const sortByDate = [...todos].sort((a, b) => {
            return new Date(a.getData().dueDate) - new Date(b.getData().dueDate);
        });

        const earliestDue = sortByDate[0].getData();

        return {
            dueDate: earliestDue.dueDate,
            priority: highestPriority.priority,
            description: earliestDue.description
        };
    };

    return { name, addTodo, getTodos, getSummary };
};
