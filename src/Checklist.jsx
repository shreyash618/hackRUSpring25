import axios from "axios";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./Checklist.css"; // Importing the CSS file
import { API_URL } from "./config";

const Checklist = () => {
    const [tasks, setTasks] = useState([]);
    const [money, setMoney] = useState(5); // Default starting money

    // Fetch today's tasks
    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_URL}/tasks/today`);
            setTasks(response.data);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    // Fetch money from backend
    const fetchMoney = async () => {
        try {
            const response = await axios.get(`${API_URL}/money`);
            setMoney(response.data.money);
        } catch (error) {
            console.error("Error fetching money:", error);
        }
    };

    // Function to mark a task as complete and earn money
    const toggleCheck = async (taskId, isCompleted, taskDifficulty) => {
        try {
            // Optimistically update UI
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId ? { ...task, task_completed: isCompleted } : task
                )
            );

            // Calculate money reward only when marking a task as completed
            const moneyIncrease = isCompleted
                ? taskDifficulty === "easy"
                    ? 5
                    : 15
                : 0;

            // Update task completion and earn money
            const response = await axios.post(`${API_URL}/tasks/complete`, {
                task_id: taskId,
                completed: isCompleted,
                money: moneyIncrease, // Send money update to backend
            });

            // Update money state based on response
            if (response.data.new_money !== undefined) {
                setMoney(response.data.new_money);
            }

        } catch (error) {
            console.error("Error updating task:", error);
            fetchTasks(); // Reload tasks if an error occurs
        }
    };

    // WebSocket connection to receive real-time updates
    useEffect(() => {
        fetchTasks();
        fetchMoney();

        const socket = io(API_URL);

        // Listen for new tasks
        socket.on("task_added", (newTask) => {
            setTasks(prevTasks => [...prevTasks, newTask]);
        });

        // Listen for task completion updates
        socket.on("task_updated", (updatedTask) => {
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === updatedTask.id ? { ...task, task_completed: updatedTask.task_completed } : task
                )
            );
        });

        // Listen for task deletions
        socket.on("task_deleted", (deletedTask) => {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== deletedTask.id));
        });

        // Listen for money updates from the backend
        socket.on("money_updated", (newMoney) => {
            setMoney(newMoney);
        });

        return () => socket.disconnect();
    }, []);

    return (
        <div className="checklist-container">
            <h2 className="checklist-title">To-Do List</h2>
            <p className="money-display">Coins: <span>{money}</span> 🪙</p>
            {tasks.length === 0 ? (
                <p className="empty-tasks-message">No tasks added yet. Add a task above to get started!</p>
            ) : (
                <ul className="checklist">
                    {tasks.map((task) => (
                        <li key={task.id} className={`task-item ${task.task_completed ? "completed" : ""}`}>
                            <input
                                type="checkbox"
                                checked={task.task_completed}
                                onChange={(e) => toggleCheck(task.id, e.target.checked, task.task_difficulty)}
                                className="checkbox"
                            />
                            <span>{task.task_name} <span className="difficulty">({task.task_difficulty})</span></span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Checklist;
