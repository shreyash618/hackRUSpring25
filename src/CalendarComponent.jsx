import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalenderComponent.css';
import { API_URL } from './config';

const MAX_CHARS = 12; // Max characters to show before truncating

const CalendarComponent = () => {
    const [tasks, setTasks] = useState({});
    const [popup, setPopup] = useState(null); // { dateString, x, y }
    const popupRef = useRef(null);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_URL}/tasks`);
            const data = response.data;
            const formattedTasks = {};

            data.forEach((task) => {
                if (!formattedTasks[task.task_date]) {
                    formattedTasks[task.task_date] = [];
                }
                formattedTasks[task.task_date].push({
                    text: task.task_name,
                    completed: task.task_completed,
                    difficulty: task.task_difficulty,
                });
            });

            setTasks(formattedTasks);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    useEffect(() => {
        fetchTasks();

        const socket = io(API_URL);
        socket.on("task_added", () => fetchTasks());
        socket.on("task_updated", () => fetchTasks());
        socket.on("task_deleted", () => fetchTasks());

        // Listen for local task changes (reliable fallback if sockets fail)
        const handleTasksChanged = () => fetchTasks();
        window.addEventListener("tasks-changed", handleTasksChanged);

        return () => {
            socket.disconnect();
            window.removeEventListener("tasks-changed", handleTasksChanged);
        };
    }, []);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                setPopup(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getTileClass = (date) => {
        const dateString = date.toISOString().split("T")[0];
        if (!tasks[dateString]) return "";
        return tasks[dateString].every((task) => task.completed) ? "completed" : "task";
    };

    const handleTileClick = (dateString, e) => {
        if (!tasks[dateString]) return;
        // Position popup near the click
        const rect = e.currentTarget.getBoundingClientRect();
        setPopup({
            dateString,
            x: rect.left + rect.width / 2,
            y: rect.bottom + 4,
        });
    };

    const truncate = (text) => {
        return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + "..." : text;
    };

    return (
        <div className="calendar-container" style={{ position: "relative" }}>
            <Calendar
                tileClassName={({ date }) => getTileClass(date)}
                tileContent={({ date }) => {
                    const dateString = date.toISOString().split("T")[0];
                    return tasks[dateString] ? (
                        <div
                            className="tile-task-preview"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleTileClick(dateString, e);
                            }}
                        >
                            <span
                                className="task-preview-text"
                                style={{ color: tasks[dateString][0].completed ? "gray" : "black" }}
                            >
                                {truncate(tasks[dateString][0].text)}
                            </span>
                            {tasks[dateString].length > 1 && (
                                <span className="task-preview-more">+{tasks[dateString].length - 1} more</span>
                            )}
                        </div>
                    ) : null;
                }}
            />

            {/* Popup overlay */}
            {popup && tasks[popup.dateString] && (
                <div
                    ref={popupRef}
                    className="calendar-task-popup"
                    style={{
                        position: "fixed",
                        left: popup.x,
                        top: popup.y,
                        transform: "translateX(-50%)",
                        zIndex: 1000,
                    }}
                >
                    <div className="popup-header">Tasks for {popup.dateString}</div>
                    <ul className="popup-task-list">
                        {tasks[popup.dateString].map((task, index) => (
                            <li
                                key={index}
                                className={`popup-task-item ${task.completed ? "popup-completed" : ""}`}
                            >
                                <span className="popup-task-name">{task.text}</span>
                                <span className="popup-task-difficulty">({task.difficulty})</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CalendarComponent;
