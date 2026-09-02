import { useState, useEffect } from 'react';

export function useTypewriter(words: string[], typingSpeed = 50, deletingSpeed = 30, delayBetweenWords = 2000) {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;

    const currentWord = words[wordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (text !== currentWord) {
          setText(currentWord.substring(0, text.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), delayBetweenWords);
        }
      } else {
        if (text === '') {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        } else {
          setText(currentWord.substring(0, text.length - 1));
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords]);

  return text;
}
