import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({ active, onComplete }) => {
  useEffect(() => {
    if (active) {
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.7 },
      });
      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    }
    // eslint-disable-next-line
  }, [active]);

  return null;
};

export default Confetti;
