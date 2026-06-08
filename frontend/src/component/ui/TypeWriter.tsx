import React, { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number; // Tốc độ gõ (ms)
}

export const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 25 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset khi text thay đổi
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  // Logic gõ từng chữ
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className="font-mono leading-relaxed">
      {displayedText}
      {/* Con trỏ nhấp nháy */}
      <span className="animate-pulse ml-1 inline-block w-2 h-4 bg-neon-cyan align-middle"></span>
    </span>
  );
};