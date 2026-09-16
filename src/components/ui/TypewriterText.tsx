import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function TypewriterText({ messages, className = "" }: { messages: string[], className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 3000); // Change message every 3 seconds
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden h-6 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <TypewriterSingleText text={messages[currentIndex]} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TypewriterSingleText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayText("");
    const timer = setInterval(() => {
      setDisplayText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(timer);
      }
    }, 40); // typing speed
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className="ml-0.5 inline-block w-[1px] h-[1em] bg-current align-middle"
      />
    </span>
  );
}
