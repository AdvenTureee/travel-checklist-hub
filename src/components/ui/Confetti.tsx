import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({ active, onComplete }) => {
  useEffect(() => {
    if (active) {
      // Calcula a posição da viewport para evitar distorção no final do scroll
const yOffset = window.scrollY || window.pageYOffset;
const viewportHeight = window.innerHeight;
const docHeight = document.documentElement.scrollHeight;
const isAtBottom = yOffset + viewportHeight >= docHeight - 10;
confetti({
  particleCount: 180,
  spread: 90,
  origin: {
    y: isAtBottom ? (viewportHeight - 100) / docHeight : 0.7
  },
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
