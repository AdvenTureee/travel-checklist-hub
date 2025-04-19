import React, { useEffect, useState } from 'react';
import { FlagIcon } from './FlagIcon';

const clocks = [
  { city: 'Brasília', tz: 'America/Sao_Paulo', country: 'br' as const },
  { city: 'Barcelona', tz: 'Europe/Madrid', country: 'es' as const },
  { city: 'Nova York', tz: 'America/New_York', country: 'us' as const },
] as const;

function getTimeInZone(timeZone: string) {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone })
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });
}

export const WorldClock: React.FC = () => {
  const [times, setTimes] = useState(clocks.map(c => getTimeInZone(c.tz)));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimes(clocks.map(clock => getTimeInZone(clock.tz)));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap gap-4 md:gap-8 justify-center items-center mb-8">
      {clocks.map((clock, idx) => (
        <div
          key={clock.city}
          className="flex flex-row items-center bg-white rounded-xl shadow-md border-2 border-travel-mustard px-4 md:px-6 py-4 min-w-[140px] md:min-w-[170px] max-w-[220px] mb-4 overflow-hidden"
        >
          <FlagIcon country={clock.country} size={48} className="mr-4 caricature-clock-flag" />
          <div className="flex flex-col items-stretch">
            <span className="caricature-clock-city-sys text-travel-blue mb-1 truncate w-full">{clock.city}</span>
            <span className="caricature-clock-time-sys text-3xl text-travel-blue">{formatTime(times[idx])}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorldClock;
