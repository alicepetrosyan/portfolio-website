import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './about.css';
import AboutModel from './AboutModel';
import TypingTitle from './TypingTitle';
import { scrollToSection } from '../utils/scroll';
import aboutContent from '../data/about.json';

const { lead, bullets: BULLETS, closing } = aboutContent;

function About() {
  const sectionRef = useRef(null);
  const [showCopy, setShowCopy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          setShowCopy(true);
            observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="section about-container" ref={sectionRef}>
      <div className="about-layout">
        <div className="about-copy">
          <TypingTitle className="pixel-title pixel-title--display about-title" text="about me" />
          <motion.p
            className="about-lead"
            initial={{ opacity: 0, y: 28 }}
            animate={showCopy ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            {lead}
          </motion.p>
          <ul className="bullet-points">
            {BULLETS.map((item, index) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, y: 36 }}
                animate={showCopy ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.25 + index * 0.12 }}
              >
                {item}
              </motion.li>
            ))}
          </ul>
          <motion.p
            className="about-lead"
            initial={{ opacity: 0, y: 20 }}
            animate={showCopy ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.85 }}
          >
            {closing.before}
            <button type="button" className="emphasis" onClick={() => scrollToSection('projects')}>
              {closing.projectsLink}
            </button>
            {closing.between}
            <button type="button" className="emphasis" onClick={() => scrollToSection('personal')}>
              {closing.hobbiesLink}
            </button>
            {closing.after}
          </motion.p>
        </div>
        <AboutModel />
      </div>
    </section>
  );
}

export default About;
