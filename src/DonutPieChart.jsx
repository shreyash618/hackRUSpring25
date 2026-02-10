import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import axios from "axios";
import "chart.js/auto";
import "./DonutPieChart.css";
import { API_URL } from "./config"; 

const DonutPieChart = () => {
  const [completedTasks, setCompletedTasks] = useState(0);
  const [uncompletedTasks, setUncompletedTasks] = useState(0);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${API_URL}/tasks/today`);
        const tasks = response.data;
        const completed = tasks.filter((task) => task.task_completed).length;
        setCompletedTasks(completed);
        setUncompletedTasks(tasks.length - completed);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };
    fetchTasks();
  }, []);

  const data = {
    labels: ["Completed", "Uncompleted"],
    datasets: [
      {
        data: [completedTasks, uncompletedTasks],
        backgroundColor: ["#FF6B6B", "#4D96FF"], // Coral Pink & Blue
        borderColor: ["#D64040", "#3562A5"], // Darker borders
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
    },
  };

  return (
    <div className="donut-chart-wrapper">
      <h4 className="progress-title">Progress</h4>
      <Doughnut data={data} options={options} />
      <div className="donut-label">
        Tasks Completed:  {completedTasks} Remaining: {uncompletedTasks}
      </div>
    </div>
  );
};

export default DonutPieChart;
