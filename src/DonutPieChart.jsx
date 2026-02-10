import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import axios from "axios";
import { io } from "socket.io-client";
import "chart.js/auto";
import "./DonutPieChart.css";
import { API_URL } from "./config"; 

const DonutPieChart = () => {
  const [completedTasks, setCompletedTasks] = useState(0);
  const [uncompletedTasks, setUncompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks/today`);
      const tasks = response.data;
      const completed = tasks.filter((task) => task.task_completed).length;
      setCompletedTasks(completed);
      setUncompletedTasks(tasks.length - completed);
      setTotalTasks(tasks.length);
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

  const isEmpty = totalTasks === 0;

  const data = {
    labels: isEmpty ? ["No Tasks"] : ["Completed", "Uncompleted"],
    datasets: [
      {
        data: isEmpty ? [1] : [completedTasks, uncompletedTasks],
        backgroundColor: isEmpty ? ["#d4d4d4"] : ["#FF6B6B", "#4D96FF"],
        borderColor: isEmpty ? ["#bbb"] : ["#D64040", "#3562A5"],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    cutout: "70%", 
    responsive: false, 
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: !isEmpty },
    },
  };

  return (
    <div className="donut-chart-wrapper">
      <h4 className="progress-title">Progress</h4>
      <Doughnut data={data} options={options} />
      <div className={`donut-label ${isEmpty ? "donut-label-empty" : ""}`}>
        {isEmpty
          ? "No tasks added yet"
          : `Tasks Completed: ${completedTasks}  Remaining: ${uncompletedTasks}`
        }
      </div>
    </div>
  );
};

export default DonutPieChart;
