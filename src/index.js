import "./styles.css";

const createTodo = (title, description, dueDate, priority, notes = "") => {
    let completed = false;
    
    const toggleCompleted = () => {
        completed = !completed;
    };

    const setNotes = (newNotes) => {
        notes = newNotes;
    };

    const getData = () => {
        return {
            title,
            description,
            dueDate,
            priority,
            notes,
            completed
        };
    };

    return {
        toggleCompleted,
        setNotes,
        getData
    };
};
