import { useEffect, useRef, useState } from 'react';

function TypingTitle({ as: Heading = 'h2', text, className = '' }) {
  const headingRef = useRef(null);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading || !text) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(text);
      return undefined;
    }

    let timer;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let index = 0;
      timer = window.setInterval(() => {
        index += 1;
        setTyped(text.slice(0, index));
        if (index >= text.length) window.clearInterval(timer);
      }, 70);
    }, { threshold: 0.35 });

    observer.observe(heading);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [text]);

  return (
    <Heading ref={headingRef} className={className} aria-label={text} aria-live="off">
      {typed}
      <span className="type-caret" aria-hidden="true">{typed.length < text.length ? '|' : ''}</span>
    </Heading>
  );
}

export default TypingTitle;