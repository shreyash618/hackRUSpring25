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


  // Check if we're in iframe mode and hide navbar accordingly
  const isInIframe = window.location.search.includes('iframe=true') || window.self !== window.top;
  
  return (
    <Router>
      <div className={`app-container ${isInIframe ? 'iframe-mode' : ''}`}>
        {!isInIframe && <Navbar />}
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
      {/* Pet iframe on left, title + task form stacked on right */}
      <section className="iframe-layout">
        <div className="iframe-wrapper">
          <iframe
            className="game-iframe"
            src="/game?iframe=true"
            title="Game Screen"
            frameBorder="0"
          />
        </div>

        <div className="right-column">
          <div className="hero-title">
            <h1 className="hero-heading">Go Go Puffle Care</h1>
            <p className="hero-subtitle">
              Complete real-life tasks to keep your virtual pet happy and healthy.
            </p>
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
        </div>
      </section>

      {/* Dashboard cards: Left column (Calendar + Progress/Streak/Countdown), Right column (To-Do List) */}
      <section className="dashboard-grid">
        {/* Left Column - Top: Calendar */}
        <div className="dashboard-card calendar-card">
          <h3 className="dashboard-card-title">Task Calendar</h3>
          <CalendarComponent />
        </div>
        
        {/* Left Column - Bottom Row: Progress on left, Streak+Countdown stacked on right */}
        <div className="bottom-row-wrapper">
          <div className="dashboard-card progress-card">
            <DonutPieChart />
          </div>
          <div className="streak-countdown-column">
            <div className="dashboard-card streak-card">
              <Streak />
            </div>
            <div className="dashboard-card countdown-card">
              <EndOfDayCountdown />
            </div>
          </div>
        </div>
        
        {/* Right Column - Full Height: To-Do List */}
        <div className="dashboard-card checklist-card">
          <Checklist />
        </div>
      </section>
    </div>
  );
}

export default App;
