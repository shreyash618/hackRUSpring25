import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Streak.css";
import { API_URL } from "./config";

const Streak = () => {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${API_URL}/tasks`);
        const tasks = response.data;

        // Group tasks by date
        const taskMap = {};
        tasks.forEach((task) => {
          if (!taskMap[task.task_date]) {
            taskMap[task.task_date] = [];
          }
          taskMap[task.task_date].push(task);
        });

        // Convert to array of sorted dates
        const completedDates = Object.keys(taskMap)
          .filter((date) => taskMap[date].every((task) => task.task_completed)) // Keep only fully completed days
          .sort((a, b) => new Date(a) - new Date(b)); // Sort in ascending order

        let count = 0;
        let today = new Date();
        today.setHours(0, 0, 0, 0);
        let prevDate = new Date(today);

        // Check for continuous streak until today
        for (let i = completedDates.length - 1; i >= 0; i--) {
          let currentDate = new Date(completedDates[i]);
          currentDate.setHours(0, 0, 0, 0);

          if (currentDate.getTime() === prevDate.getTime()) {
            count++;
          } else if (currentDate.getTime() === prevDate.getTime() - 86400000) {
            count++;
          } else {
            break;
          }
          prevDate = currentDate;
        }

        setStreak(count);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="streak-container">
      <h3>Streak</h3>
      <div className="streak-circle">{streak} days</div>
    </div>
  );
};

export default Streak;
