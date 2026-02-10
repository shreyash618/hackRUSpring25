import React, { useState, useEffect } from "react";
import "./Style.css";

const GamePage = () => {
  const [hunger, setHunger] = useState(() => parseInt(localStorage.getItem("hunger")) || 20);
  const [money, setMoney] = useState(() => parseInt(localStorage.getItem("money")) || 5);
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

  // Update pet image based on state changes
  useEffect(() => {
    if (!isEating && !isQueasy) {
      setPetImage(hunger <= 25 ? "/pet_sad.png" : hunger <= 65 ? "/pet_nah.png" : "/pet_happy.png");
    }
  }, [hunger, isEating, isQueasy]);

  // Save hunger and money to localStorage
  useEffect(() => {
    localStorage.setItem("hunger", hunger);
    localStorage.setItem("money", money);
  }, [hunger, money]);

  // Feed the pet
  const handleFeedPet = (hungerIncrease, cost) => {
    if (money >= cost) {
      setMoney((prevMoney) => prevMoney - cost);

      setHunger((prevHunger) => {
        const newHunger = Math.min(prevHunger + hungerIncrease, 100);

        if (!isEating) {
          setPetImage("/pet_hehe.png"); // Show eating image
          setIsEating(true);

          setTimeout(() => {
            setIsEating(false);
            setPetImage(newHunger <= 25 ? "/pet_sad.png" : newHunger <= 65 ? "/pet_nah.png" : "/pet_happy.png");
          }, 2000);
        }

        return newHunger;
      });
    } else {
      alert("Not enough coins!");
    }
  };

  // Simulate a new day (reduce hunger, add coins)
  const handleNewDay = () => {
    setHunger((prev) => {
      const newHunger = Math.max(prev - 30, 0);
      localStorage.setItem("hunger", newHunger);
      return newHunger;
    });

    setMoney((prev) => {
      const newMoney = prev + 5;
      localStorage.setItem("money", newMoney);
      return newMoney;
    });

    console.log("🌅 New day started! Hunger decreased by 30. Money increased by 5.");
  };

  // 🔄 Auto Simulate New Day Every 10 Seconds (For Testing)
  useEffect(() => {
    const interval = setInterval(handleNewDay, 600000); // Runs every 10 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);
  // Auto trigger a new day event at midnight
  // useEffect(() => {
  //   const scheduleNextDay = () => {
  //     const now = new Date();
  //     const nextMidnight = new Date(now);
  //     nextMidnight.setDate(now.getDate() + 1);
  //     nextMidnight.setHours(0, 0, 0, 0);

  //     const timeUntilNextMidnight = nextMidnight - now;

  //     setTimeout(() => {
  //       handleNewDay();
  //       scheduleNextDay();
  //     }, timeUntilNextMidnight);
  //   };

  //   scheduleNextDay();

  //   return () => clearTimeout(scheduleNextDay);
  // }, []);

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
