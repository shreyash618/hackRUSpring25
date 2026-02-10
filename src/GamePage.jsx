import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { API_URL } from "./config";
import "./Style.css";

const GamePage = () => {
  const [hunger, setHunger] = useState(() => parseInt(localStorage.getItem("hunger")) || 50);
  const [money, setMoney] = useState(0);
  const [pupilPosition, setPupilPosition] = useState({ x: 0, y: 0 });
  const [petImage, setPetImage] = useState("/pet_nah.png");
  const [isEating, setIsEating] = useState(false);
  const [isQueasy, setIsQueasy] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const isIframe = window.location !== window.parent.location;

  // Pet sleeps until the next morning once fully fed
  const [sleepingSince, setSleepingSince] = useState(() => localStorage.getItem("sleepingSince") || null);

  const isNextDay = () => {
    if (!sleepingSince) return false;
    const sleptDate = new Date(sleepingSince);
    const now = new Date();
    return now.getDate() !== sleptDate.getDate() || now.getMonth() !== sleptDate.getMonth();
  };

  // Wake up if it's a new day
  useEffect(() => {
    if (sleepingSince && isNextDay()) {
      setSleepingSince(null);
      localStorage.removeItem("sleepingSince");
      setHunger(80); // Wake up well-rested but not full
      localStorage.setItem("hunger", 80);
    }
  }, []);

  const isSleeping = (hunger >= 100 || sleepingSince) && !isEating && !isQueasy;

  const foodOptions = [
    { name: "🍏 Apple", cost: 5, hungerIncrease: 5 },
    { name: "🥕 Carrot", cost: 10, hungerIncrease: 10 },
    { name: "🍖 Meat", cost: 20, hungerIncrease: 25 },
  ];

  // Get the default pet image for a given hunger level
  const getDefaultImage = (h) => {
    if (h >= 100 || sleepingSince) return "/pet_sleeping_no_snores.png";
    if (h >= 80) return "/pet_hehe.png";
    if (h >= 50) return "/pet_happy.png";
    if (h >= 25) return "/pet_nah.png";
    return "/pet_sad.png";
  };

  // Get the status text for a given hunger level
  const getStatusText = (h) => {
    if (h >= 100 || sleepingSince) return "Your pet is napping happily";
    if (h >= 80) return "Your pet is full!";
    if (h >= 50) return "Your pet is feeling good!";
    if (h >= 25) return "Your pet is hungry";
    return "Your pet is starving!";
  };

  // Fetch money from backend on mount + listen for updates
  useEffect(() => {
    const fetchMoney = async () => {
      try {
        const response = await axios.get(`${API_URL}/money`);
        setMoney(response.data.money);
      } catch (error) {
        console.error("Error fetching money:", error);
      }
    };
    fetchMoney();

    const socket = io(API_URL);
    socket.on("money_updated", (newMoney) => {
      setMoney(newMoney);
    });
    return () => socket.disconnect();
  }, []);

  // Update pet image based on state changes
  useEffect(() => {
    if (!isEating && !isQueasy) {
      if (hunger >= 100 || sleepingSince) {
        // Start snoring animation
        setPetImage("/pet_sleeping_no_snores.png");
        const interval = setInterval(() => {
          setPetImage((prev) =>
            prev === "/pet_sleeping_no_snores.png"
              ? "/pet_sleeping_snores.png"
              : "/pet_sleeping_no_snores.png"
          );
        }, 1500);
        return () => clearInterval(interval);
      } else {
        setPetImage(getDefaultImage(hunger));
      }
    }
  }, [hunger, isEating, isQueasy, sleepingSince]);

  // Save hunger to localStorage
  useEffect(() => {
    localStorage.setItem("hunger", hunger);
  }, [hunger]);

  // Feed the pet (spend coins via backend)
  const handleFeedPet = async (hungerIncrease, cost) => {
    if (money < cost) {
      alert("Not enough coins!");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/money/spend`, { amount: cost });
      setMoney(response.data.money);

      setHunger((prevHunger) => {
        const newHunger = Math.min(prevHunger + hungerIncrease, 100);

        if (!isEating) {
          setPetImage("/pet_hehe.png");
          setIsEating(true);

          setTimeout(() => {
            setIsEating(false);
          }, 2000);
        }

        return newHunger;
      });
    } catch (error) {
      console.error("Error spending money:", error);
      if (error.response && error.response.status === 400) {
        alert("Not enough coins!");
      } else {
        alert("Something went wrong. Please try again.");
      }
    }
  };

  // Track when pet falls asleep
  useEffect(() => {
    if (hunger >= 100 && !sleepingSince) {
      const now = new Date().toISOString();
      setSleepingSince(now);
      localStorage.setItem("sleepingSince", now);
    }
  }, [hunger]);

  // Gradual hunger decrease: 15/10min awake, 2/10min sleeping
  useEffect(() => {
    const interval = setInterval(() => {
      setHunger((prev) => {
        // Don't lose hunger while sleeping (only lose 2 per tick)
        const loss = sleepingSince ? 2 : 15;
        const newHunger = Math.max(prev - loss, 0);
        localStorage.setItem("hunger", newHunger);

        // If hunger drops below 100 while sleeping, wake up
        if (newHunger < 100 && sleepingSince) {
          setSleepingSince(null);
          localStorage.removeItem("sleepingSince");
        }

        return newHunger;
      });
    }, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, [sleepingSince]);

  // Handle pet click (show queasy effect)
  const handlePetClick = () => {
    setIsQueasy(true);
    setPetImage("/pet_queasy.png");

    setTimeout(() => {
      setIsQueasy(false);
    }, 2000);
  };

  // Handle eye movement
  const handleMouseMove = (e) => {
    const container = e.currentTarget.getBoundingClientRect();
    const centerX = container.left + container.width / 2;
    const centerY = container.top + container.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const angle = Math.atan2(dy, dx);
    const maxOffset = 20;
    const x = Math.cos(angle) * maxOffset;
    const y = Math.sin(angle) * maxOffset;
    setPupilPosition({ x, y });
  };

  // Handle food hover effects
  const handleHover = () => {
    if (!isEating && !isSleeping) setPetImage("/pet_eating.png");
  };

  const handleHoverLeave = () => {
    if (!isEating && !isSleeping) {
      setPetImage(getDefaultImage(hunger));
    }
  };
  useEffect(() => {
    // Hide navbar when in iframe mode
    const params = new URLSearchParams(window.location.search);
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      if (params.get("iframe") === "true") {
        navbar.style.display = "none !important"; // Hide the navbar in iframe
        navbar.style.visibility = "hidden"; // Additional hiding method
      } else {
        navbar.style.display = "flex"; // Show the navbar when not in iframe
        navbar.style.visibility = "visible";
      }
    }
    
    // Also check if we're actually inside an iframe
    if (window.self !== window.top) {
      // We're in an iframe
      if (navbar) {
        navbar.style.display = "none !important";
        navbar.style.visibility = "hidden";
      }
    }
  }, []);

  return (
    <div className="game-container" onMouseMove={handleMouseMove}>
      {/* Red question-mark help button */}
      <button className="rules-btn" onClick={() => setShowRules(true)} title="Game Rules">?</button>

      {/* Rules overlay */}
      {showRules && (
        <div className="rules-overlay" onClick={() => setShowRules(false)}>
          <div className="rules-card" onClick={(e) => e.stopPropagation()}>
            <h2>How to Play</h2>
            <ul>
              <li><strong>Easy tasks</strong> earn you <strong>10 coins</strong>. <strong>Hard tasks</strong> earn <strong>20 coins</strong>.</li>
              <li>Complete <strong>all of today's tasks</strong> for a <strong>+50 coin bonus!</strong></li>
              <li>Unchecking a task deducts the coins you earned from it (minimum 0).</li>
              <li>Use coins to <strong>feed your pet</strong> and raise its Satisfaction Level.</li>
              <li>While <strong>awake</strong>, your pet loses <strong>15 hunger every 10 min</strong>.</li>
              <li>Feed your pet until it's completely full and it will <strong>fall asleep until the next morning</strong>.</li>
              <li>While <strong>sleeping</strong>, hunger drops very slowly (<strong>2 per 10 min</strong>), so your pet stays happy!</li>
            </ul>
            <button className="rules-close-btn" onClick={() => setShowRules(false)}>Got it!</button>
          </div>
        </div>
      )}

      <div className="money-container">
        <p>Coins: <span>{money}</span> 🪙</p>
      </div>

      <div className="food-shop">
        <h2>Food Options</h2>
        {foodOptions.map((food, index) => (
          <button
            key={index}
            className="food-item"
            onMouseEnter={handleHover}
            onMouseLeave={handleHoverLeave}
            onClick={() => handleFeedPet(food.hungerIncrease, food.cost)}
            disabled={money < food.cost}
          >
            {food.name} ({food.cost} coins)
          </button>
        ))}
      </div>

      <div className={`pet-container ${isSleeping ? "pet-sleeping" : ""}`}>
        <img id="pet-image" src={petImage} alt="Virtual Pet" onClick={!isSleeping ? handlePetClick : undefined} />

        {!isSleeping && (
          <div className="eyes">
            <div className="eye">
              <div className="ball" style={{ transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)` }}></div>
            </div>
            <div className="eye">
              <div className="ball" style={{ transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)` }}></div>
            </div>
          </div>
        )}

        <p id="pet-status">{getStatusText(hunger)}</p>
      </div>

      <div className="progress-container">
        <p>Satisfaction Level</p>
        <div className="progress-bar">
          <div id="hunger-bar" style={{ width: `${hunger}%`, backgroundColor: hunger < 50 ? "red" : "green" }}></div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
