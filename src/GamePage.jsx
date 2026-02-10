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
  const isIframe = window.location !== window.parent.location;

  const foodOptions = [
    { name: "🍏 Apple", cost: 5, hungerIncrease: 5 },
    { name: "🥕 Carrot", cost: 10, hungerIncrease: 10 },
    { name: "🍖 Meat", cost: 20, hungerIncrease: 25 },
  ];

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
      setPetImage(hunger <= 25 ? "/pet_sad.png" : hunger <= 65 ? "/pet_nah.png" : "/pet_happy.png");
    }
  }, [hunger, isEating, isQueasy]);

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
            setPetImage(newHunger <= 25 ? "/pet_sad.png" : newHunger <= 65 ? "/pet_nah.png" : "/pet_happy.png");
          }, 2000);
        }

        return newHunger;
      });
    } catch (error) {
      console.error("Error spending money:", error);
      alert("Not enough coins!");
    }
  };

  // Gradual hunger decrease: lose 15 hunger every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setHunger((prev) => {
        const newHunger = Math.max(prev - 15, 0);
        localStorage.setItem("hunger", newHunger);
        return newHunger;
      });
    }, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

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
    if (!isEating) setPetImage("/pet_eating.png");
  };

  const handleHoverLeave = () => {
    if (!isEating) {
      setPetImage(hunger <= 25 ? "/pet_sad.png" : hunger <= 65 ? "/pet_nah.png" : "/pet_happy.png");
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

      <div className="pet-container">
        <img id="pet-image" src={petImage} alt="Virtual Pet" onClick={handlePetClick} />

        <div className="eyes">
          <div className="eye">
            <div className="ball" style={{ transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)` }}></div>
          </div>
          <div className="eye">
            <div className="ball" style={{ transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)` }}></div>
          </div>
        </div>

        <p id="pet-status">
          {hunger <= 25 ? "Your pet is starving!" : hunger <= 65 ? "Your pet is still hungry!" : "Your pet is happy!"}
        </p>
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
