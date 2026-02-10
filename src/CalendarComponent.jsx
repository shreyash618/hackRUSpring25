import axios from 'axios';
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalenderComponent.css';
import { API_URL } from './config';

const CalendarComponent = () => {
    const [tasks, setTasks] = useState({});

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_URL}/tasks`);
    
            const data = response.data; // Axios automatically parses JSON
            const formattedTasks = {};
    
            // Iterate over each task and group them by date
            data.forEach((task) => {
                if (!formattedTasks[task.task_date]) {
                    formattedTasks[task.task_date] = []; // Initialize array
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
    
    useEffect (() => {
        fetchTasks();}, []);

        // Returns "completed" if all tasks for a day are completed, otherwise "task"
    const getTileClass = (date) => {
        const dateString = date.toISOString().split("T")[0];
        if (!tasks[dateString]) return "";
        return tasks[dateString].every((task) => task.completed) ? "completed" : "task";
    };

    return (
        <div className="calendar-container">
            <Calendar
                tileClassName={({ date }) => getTileClass(date)}
                tileContent={({ date }) => {
                    const dateString = date.toISOString().split("T")[0];
                    return tasks[dateString] ? (
                        <div>
                            <ul className="task-list">
                                {tasks[dateString].map((task, index) => (
                                    <li title ={task.text} key={index} style={{ color: task.completed ? "gray" : "black" }}>
                                        {task.text}
                                    </li>
                                ))}
                            </ul>
                            {/* Tooltip that appears on hover */}
                            <div className="tooltip">
                                {tasks[dateString].map((task, index) => (
                                    <div key={index}>{task.text} ({task.difficulty})</div>
                                ))}
                            </div>
                        </div>
                    ) : null;
                }}
            />
        </div>
    );
};

export default CalendarComponent;
