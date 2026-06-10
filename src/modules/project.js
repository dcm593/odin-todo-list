export const createProject = (name) => {
  const todos = [];

  let completed = false;

  const addTodo = (todo) => {
    todos.push(todo);
  };

  const getTodos = () => ({ todos });

  const toggleCompleted = () => {
    completed = !completed;
  };

  const isCompleted = () => completed;

  // Helper function to get a summary of the project (e.g. for dashboard cards)
  const getSummary = () => {
    if (todos.length === 0) return null;

    const priorityMap = { High: 3, Medium: 2, Low: 1 };

    const todo = [...todos]
      .sort((a, b) => {
        const dataA = a.getData();
        const dataB = b.getData();

        // Sort by priority first
        const priorityDiff =
          priorityMap[dataB.priority] - priorityMap[dataA.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by due date (earliest first)
        return new Date(dataA.dueDate) - new Date(dataB.dueDate);
      })[0]
      .getData();

    return {
      dueDate: todo.dueDate,
      priority: todo.priority,
      description: todo.description,
      title: todo.title,
    };
  };

  const clearTodos = () => {
    todos.length = 0;
  };

  return {
    name,
    addTodo,
    getTodos,
    clearTodos,
    getSummary,
    toggleCompleted,
    isCompleted,
  };
};
