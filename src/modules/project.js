export const createProject = (name) => {
    const todos = [];

    const addTodo = (todo) => {
        todos.push(todo);
    };

    const getTodos = () => ({ todos });

    return { name, addTodo, getTodos };
};