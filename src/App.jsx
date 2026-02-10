import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import About from "./About";
import GamePage from "./GamePage";
import EndOfDayCountdown from "./EndOfDayCountdown";
import Checklist from "./Checklist";
import DonutPieChart from "./DonutPieChart";
import Streak from "./Streaks";
import CalendarComponent from "./CalendarComponent";
import { useState } from "react";
import "./App.css";
import { API_URL } from "./config";

function App() {
  const [taskName, setTaskName] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskDifficulty, setTaskDifficulty] = useState("");

  const addTask = async () => {
    if (!taskName.trim() || !taskDate.trim() || !taskDifficulty.trim()) return;

    try {
        const response = await fetch(`${API_URL}/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                task_name: taskName,
                task_date: taskDate,
                task_difficulty: taskDifficulty, 
                task_completed: false
            })
        });

        const data = await response.json();
        if (response.ok) {
            setTaskName(""); setTaskDate(""); setTaskDifficulty(""); // Clear input fields
        } else {
            console.error(data.error);
        }
    } catch (error) {
        console.error("Error adding task:", error);
    }
};


  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home 
          taskName={taskName} setTaskName={setTaskName}
          taskDate={taskDate} setTaskDate={setTaskDate}
          taskDifficulty={taskDifficulty} setTaskDifficulty={setTaskDifficulty}
          addTask={addTask}
          />} />
          <Route path="/game" element={<GamePage isIframe={false} />} />
          <Route path='/about' element={<About/>}/>
        </Routes>
      </div>
    </Router>
  );
}

function Home({ taskName, setTaskName, taskDate, setTaskDate, taskDifficulty, setTaskDifficulty, addTask }){
  return (
    <div className="main-container">
      {/* Hero title above the pet / iframe */}
      <section className="hero-title">
        <h1 className="hero-heading">Go Go Puffle Care</h1>
        <p className="hero-subtitle">
          Complete real-life tasks to keep your virtual pet happy and healthy.
        </p>
      </section>

      {/* Pet iframe + task form side by side */}
      <section className="iframe-layout">
        <div className="iframe-wrapper">
          <iframe
            className="game-iframe"
            src="/game?iframe=true"
            title="Game Screen"
            frameBorder="0"
          />
        </div>

        <div className="task-form-card">
          <h2 className="task-form-heading">Add a Task</h2>
          <div className="task-form-container">
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Task Name"
            />
            <input
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
            />
            <select
              value={taskDifficulty}
              onChange={(e) => setTaskDifficulty(e.target.value)}
            >
              <option value="">Select Difficulty</option>
              <option value="easy">Easy</option>
              <option value="hard">Hard</option>
            </select>
            <button onClick={addTask}>Add Task</button>
          </div>
        </div>
      </section>

      {/* Dashboard cards: Calendar, To-do list, countdown, progress, streak */}
      <section className="dashboard-grid">
        <div className="dashboard-card calendar-card">
          <h3 className="dashboard-card-title">Task Calendar</h3>
          <CalendarComponent />
        </div>
        <div className="dashboard-card">
          <Checklist />
        </div>
        <div className="dashboard-card">
          <EndOfDayCountdown />
        </div>
        <div className="dashboard-card">
          <DonutPieChart />
        </div>
        <div className="dashboard-card">
          <Streak />
        </div>
      </section>
    </div>
  );
}

export default App;
