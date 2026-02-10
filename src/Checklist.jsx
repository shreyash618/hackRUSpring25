import axios from "axios";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./Checklist.css"; // Importing the CSS file
import { API_URL } from "./config";

const Checklist = () => {
    const [todayTasks, setTodayTasks] = useState([]);
    const [overdueTasks, setOverdueTasks] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [money, setMoney] = useState(0);

    const fetchTodayTasks = async () => {
        try {
            const response = await axios.get(`${API_URL}/tasks/today`);
            setTodayTasks(response.data);
        } catch (error) {
            console.error("Error fetching today's tasks:", error);
        }
    };

    const fetchOverdueTasks = async () => {
        try {
            const response = await axios.get(`${API_URL}/tasks/overdue`);
            setOverdueTasks(response.data);
        } catch (error) {
            console.error("Error fetching overdue tasks:", error);
        }
    };

    const fetchUpcomingTasks = async () => {
        try {
            const response = await axios.get(`${API_URL}/tasks/upcoming`);
            setUpcomingTasks(response.data);
        } catch (error) {
            console.error("Error fetching upcoming tasks:", error);
        }
    };

    const fetchMoney = async () => {
        try {
            const response = await axios.get(`${API_URL}/money`);
            setMoney(response.data.money);
        } catch (error) {
            console.error("Error fetching money:", error);
        }
    };

    const refreshAll = () => {
        fetchTodayTasks();
        fetchOverdueTasks();
        fetchUpcomingTasks();
        fetchMoney();
    };

    const toggleCheck = async (taskId, isCompleted, taskDifficulty) => {
        try {
            // Optimistically update both today and overdue lists
            const updateList = (prevTasks) =>
                prevTasks.map(task =>
                    task.id === taskId ? { ...task, task_completed: isCompleted } : task
                );
            setTodayTasks(updateList);
            setOverdueTasks(updateList);

            const response = await axios.post(`${API_URL}/tasks/complete`, {
                task_id: taskId,
                completed: isCompleted,
            });

            if (response.data.new_money !== undefined) {
                setMoney(response.data.new_money);
            }

            // Always re-fetch everything after a toggle to stay in sync
            refreshAll();
            // Notify other components (calendar, chart, streak) to refresh
            window.dispatchEvent(new Event("tasks-changed"));
        } catch (error) {
            console.error("Error updating task:", error);
            refreshAll();
        }
    };

    useEffect(() => {
        refreshAll();

        const socket = io(API_URL);
        socket.on("task_added", () => refreshAll());
        socket.on("task_updated", () => refreshAll());
        socket.on("task_deleted", () => refreshAll());
        socket.on("money_updated", (newMoney) => setMoney(newMoney));

        return () => socket.disconnect();
    }, []);

    // Format date for display (e.g. "Feb 12")
    const formatDate = (dateStr) => {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Get coin reward for a task
    const coinWorth = (difficulty) => (difficulty === "easy" ? 10 : 20);

    // Sum total coins earnable from a list of tasks
    const totalCoins = (tasks) => tasks.reduce((sum, t) => sum + coinWorth(t.task_difficulty), 0);

    return (
        <div className="checklist-container">
            <h2 className="checklist-title">To-Do List</h2>
            <p className="money-display">Coins: <span>{money}</span> 🪙</p>

            {/* Today's Tasks */}
            <div className="section-heading-row">
                <h3 className="section-heading">Today's Tasks</h3>
                {todayTasks.length > 0 && <span className="section-coins">{totalCoins(todayTasks)} coins</span>}
            </div>
            {todayTasks.length === 0 ? (
                <p className="empty-tasks-message">No tasks for today. Enjoy your day!</p>
            ) : (
                <ul className="checklist">
                    {todayTasks.map((task) => (
                        <li key={task.id} className={`task-item ${task.task_completed ? "completed" : ""}`}>
                            <input
                                type="checkbox"
                                checked={task.task_completed}
                                onChange={(e) => toggleCheck(task.id, e.target.checked, task.task_difficulty)}
                                className="checkbox"
                            />
                            <span className="task-name-text">{task.task_name} <span className="difficulty">({task.task_difficulty})</span></span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Upcoming Tasks */}
            <div className="section-heading-row">
                <h3 className="section-heading">Upcoming Tasks</h3>
                {upcomingTasks.length > 0 && <span className="section-coins">{totalCoins(upcomingTasks)} coins</span>}
            </div>
            {upcomingTasks.length === 0 ? (
                <p className="empty-tasks-message">No upcoming tasks scheduled.</p>
            ) : (
                <ul className="checklist">
                    {upcomingTasks.map((task) => (
                        <li key={task.id} className={`task-item ${task.task_completed ? "completed" : ""}`}>
                            <input
                                type="checkbox"
                                checked={task.task_completed}
                                onChange={(e) => toggleCheck(task.id, e.target.checked, task.task_difficulty)}
                                className="checkbox"
                            />
                            <span className="task-name-text">{task.task_name} <span className="difficulty">({task.task_difficulty})</span></span>
                            <span className="task-date-badge">{formatDate(task.task_date)}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Overdue Tasks */}
            <div className="section-heading-row">
                <h3 className="section-heading">Overdue</h3>
                {overdueTasks.length > 0 && <span className="section-coins">{totalCoins(overdueTasks)} coins</span>}
            </div>
            {overdueTasks.length === 0 ? (
                <p className="empty-tasks-message">No overdue tasks!</p>
            ) : (
                <ul className="checklist">
                    {overdueTasks.map((task) => (
                        <li key={task.id} className={`task-item ${task.task_completed ? "completed" : ""}`}>
                            <input
                                type="checkbox"
                                checked={task.task_completed}
                                onChange={(e) => toggleCheck(task.id, e.target.checked, task.task_difficulty)}
                                className="checkbox"
                            />
                            <span className="task-name-text">{task.task_name} <span className="difficulty">({task.task_difficulty})</span></span>
                            <span className="task-date-badge">{formatDate(task.task_date)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Checklist;
