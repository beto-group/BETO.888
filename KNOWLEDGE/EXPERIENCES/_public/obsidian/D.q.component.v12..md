


# viewer

```jsx
const { useState, useQuery, useArray, useEffect } = dc;

const initialSettings = {
  columns: {
    "To Do": [],
    "In Progress": [],
    "Done": [],
    "Unclean": [],
  },
};

const initialPath = "COOKBOOK/RECIPES/ALL";

const KanbanBoard = ({ initialSettingsOverride = {} }) => {
  const mergedSettings = {
    ...initialSettings,
    ...initialSettingsOverride,
  };

  const [columns, setColumns] = useState(mergedSettings.columns);
  const [taskInput, setTaskInput] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [queryPath, setQueryPath] = useState(initialPath);
  const [nameFilter, setNameFilter] = useState("");

  // Fetch recipes from the path
  const query = `@page and path("${queryPath}")`;
  const recipes = useQuery(query);
  const filteredRecipes = useArray(recipes, (array) => {
    if (!array) {
      console.warn("No data returned from query.");
      return [];
    }
    return array.where((x) => nameFilter === "" || x.$name.toLowerCase().includes(nameFilter.toLowerCase()));
  });

  useEffect(() => {
    console.log("Fetched recipes (raw):", recipes);
    console.log("Filtered recipes (processed):", filteredRecipes);
    // Add fetched recipes to the "Unclean" column
    if (filteredRecipes && filteredRecipes.length > 0) {
      setColumns((prev) => ({
        ...prev,
        Unclean: filteredRecipes.map((recipe) => ({ id: recipe.$name, title: recipe.$name })),
      }));
    } else {
      console.warn("No recipes found for the given path or filter.");
    }
  }, [recipes, filteredRecipes]);

  const addTask = () => {
    if (!taskInput.trim()) return;
    setColumns((prev) => ({
      ...prev,
      "To Do": [...prev["To Do"], { id: Date.now(), title: taskInput.trim() }],
    }));
    setTaskInput("");
  };

  const removeTask = (columnKey, taskId) => {
    setColumns((prev) => ({
      ...prev,
      [columnKey]: prev[columnKey].filter((task) => task.id !== taskId),
    }));
  };

  const moveTask = (task, fromColumn, toColumn) => {
    setColumns((prev) => ({
      ...prev,
      [fromColumn]: prev[fromColumn].filter((t) => t.id !== task.id),
      [toColumn]: [...prev[toColumn], task],
    }));
  };

  const handleEditTask = (columnKey, task) => {
    setEditingTask({ columnKey, task });
    setTaskInput(task.title);
  };

  const updateTask = () => {
    if (!editingTask) return;
    const { columnKey, task } = editingTask;
    setColumns((prev) => ({
      ...prev,
      [columnKey]: prev[columnKey].map((t) =>
        t.id === task.id ? { ...t, title: taskInput.trim() } : t
      ),
    }));
    setEditingTask(null);
    setTaskInput("");
  };

  return (
    <div style={styles.kanbanBoard}>
      <div style={styles.kanbanAddTask}>
        <input
          type="text"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder="Add a new task..."
          style={styles.kanbanAddTaskInput}
        />
        <button onClick={editingTask ? updateTask : addTask} style={styles.kanbanAddTaskButton}>
          {editingTask ? "Update Task" : "Add Task"}
        </button>
      </div>
      <div style={styles.kanbanColumns}>
        {Object.keys(columns).map((columnKey) => (
          <div key={columnKey} style={styles.kanbanColumn}>
            <h2>{columnKey}</h2>
            <div style={styles.kanbanTasks}>
              {columns[columnKey].map((task) => (
                <div key={task.id} style={styles.kanbanTask}>
                  <span>{task.title}</span>
                  <div style={styles.taskActions}>
                    <button onClick={() => handleEditTask(columnKey, task)} style={styles.taskActionButton}>
                      Edit
                    </button>
                    <button onClick={() => removeTask(columnKey, task.id)} style={styles.taskActionButton}>
                      Delete
                    </button>
                    {Object.keys(columns).map((targetColumnKey) => (
                      targetColumnKey !== columnKey && (
                        <button
                          key={targetColumnKey}
                          onClick={() => moveTask(task, columnKey, targetColumnKey)}
                          style={styles.taskActionButton}
                        >
                          Move to {targetColumnKey}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  kanbanBoard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    backgroundColor: '#f0f0f0',
    minHeight: '100vh',
  },
  kanbanAddTask: {
    display: 'flex',
    marginBottom: '20px',
  },
  kanbanAddTaskInput: {
    flex: 1,
    padding: '10px',
    fontSize: '16px',
  },
  kanbanAddTaskButton: {
    padding: '10px',
    marginLeft: '10px',
    fontSize: '16px',
  },
  kanbanColumns: {
    display: 'flex',
    gap: '20px',
  },
  kanbanColumn: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '10px',
    flex: 1,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  kanbanTasks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '10px',
  },
  kanbanTask: {
    backgroundColor: '#f9f9f9',
    padding: '10px',
    borderRadius: '4px',
    boxShadow: '0 1px 5px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskActions: {
    display: 'flex',
  },
  taskActionButton: {
    marginLeft: '5px',
  },
};

return { KanbanBoard };
```