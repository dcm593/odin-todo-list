export const createTodo = (
  title,
  description,
  dueDate,
  priority,
  notes = "",
) => {
  let completed = false;

  const id = crypto.randomUUID();

  const toggleCompleted = () => {
    completed = !completed;
  };

  const setNotes = (newNotes) => {
    notes = newNotes;
  };

  const getData = () => ({
    title,
    description,
    dueDate,
    priority,
    notes,
    completed,
  });

  return { id, toggleCompleted, setNotes, getData };
};
