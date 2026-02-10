import React from "react";
import Countdown from "react-countdown";
import './App.css'

const EndOfDayCountdown = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    // Custom renderer for Countdown
    const countdownRenderer = ({ hours, minutes, seconds }) => (
        <span>{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
    );

    return (
        <div className="countdown" style={{ fontSize: "20px", fontFamily: "Arial, sans-serif", color: "red", textAlign: 'center', margin: '0'}}>
            <h3 style={{ color: "black", margin: "0 0 8px 0", fontSize: "1rem" }}>Countdown</h3>
            <Countdown date={midnight} renderer={countdownRenderer} />
        </div>
    );
};

export default EndOfDayCountdown;
