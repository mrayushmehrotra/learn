import React, { useState, useEffect } from 'react';

const Countdown: React.FC = () => {
  const [time, setTime] = useState("");
  useEffect(() => {
    const target = new Date("2025-07-25T00:00:00");
    const interval = setInterval(() => {
      const diff = target.getTime() - new Date().getTime();
      if (diff <= 0) {
        setTime("0d 0h 0m 0s");
        clearInterval(interval);
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTime(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="text-sm text-gray-600 mt-2">
      Settlement Time: <span className="font-semibold">{time}</span>
    </div>
  );
};

export default Countdown; 