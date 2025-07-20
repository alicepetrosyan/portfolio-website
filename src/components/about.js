import React, { useState, useEffect } from 'react';
import './about.css';
import Stack from './CardStack.js';
import {motion, transform, useScroll, useTransform} from 'framer-motion';

function About() {

  const { scrollYProgress } = useScroll({
    offset: ["start start", "end start"],
  });

  const [startingOpacity, setStartingOpacity] = useState(0);
  const [startingAngle, setStartingAngle] = useState(0);
  const [startingSize, setStartingSize] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const [startingHeadingRotation, setStartingHeadingRotation] = useState(0);
  const [startingHeadingSize, setStartingHeadingSize] = useState(0);
  const [startingY, setStartingY] = useState(0);
  const [startingX, setStartingX] = useState(0);

    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth <=1100) {
          setStartingOpacity(1);
          setStartingAngle("0deg");
          setStartingSize(1);
          setStartingHeadingRotation("0deg");
          setStartingHeadingSize(1);
          setStartingY(0);
          setStartingX(0);

          setCardHeight("480px");
          setCardWidth("400px");
        }
        else if (window.innerWidth <=1250) {
          setStartingOpacity(1);
          setStartingAngle("0deg");
          setStartingSize(1);
          setStartingHeadingRotation("0deg");
          setStartingHeadingSize(1);
          setStartingY(0);
          setStartingX(0);
          
          setCardHeight("480px");
          setCardWidth("400px");
        }
        else {
          setStartingOpacity(0);
          setStartingAngle("15deg");
          setStartingSize(1.3);
          setStartingHeadingRotation("-10deg");
          setStartingHeadingSize(1.5);
          setStartingY(200);
          setStartingX(-100);

          setCardHeight("480px");
          setCardWidth("400px");
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);
    
  const contentOpacity = useTransform(scrollYProgress, [0.22, 0.33], [startingOpacity, 1]);
  const contentSize = useTransform(scrollYProgress, [0.22, 0.33], [startingSize, 1]);
  const contentY = useTransform(scrollYProgress, [0.22, 0.33], [startingY,0]);
  const contentX = useTransform(scrollYProgress, [0.22, 0.33], [startingX,0]);
  const textRotation = useTransform(scrollYProgress, [0.22, 0.33], [startingAngle, "0deg"]);
  const headingRotation = useTransform(scrollYProgress, [0.15, 0.3], [startingHeadingRotation, "0deg"]);
  const headingSize = useTransform(scrollYProgress, [0.15, 0.3], [startingHeadingSize, 1]);

  return (
    <div className = 'about-container'>
      <div className='background' />
      <motion.div className='content'>
        <div className='title-and-stack'>
          <motion.h className = "about-title" style={{scale: headingSize, rotate: headingRotation}}>about me</motion.h>
          <motion.div className='photocollection-wrapper' style={{opacity: contentOpacity, scale: contentSize, y: contentY, x: contentX}}>
            <Stack cardDimensions={{width: cardWidth, height: cardHeight}} className='photo-collection'/>
          </motion.div>
        </div>
        <motion.p style={{rotateZ: textRotation , scale: contentSize, y: contentY, x: contentY, opacity: contentOpacity}}>
          Hi, I'm Alice! I'm a Mechatronics Engineering student at the University of Waterloo with a passion for robotics
          and baking. My interests lie within mechanical design and control systems. Outside of my academics you'll find me: 
          <ul className='bullet-points'>
            <li> Designing and manufacturing the aero package of an electric racecar as part of UWFE's aerodynamics subteam </li>
            <li> Tinkering away on personal projects </li>
            <li> Developing and testing new recipes </li>
            <li> Drawing the assets you see on this site </li>
          </ul>
          This portfolio showcases some of the <a className='emphasis'href="/projects">
          projects I've worked on</a>, as well as <a className='emphasis'href="/personal">my hobbies</a>.
        </motion.p>
      </motion.div>
    </div>
  )
}

export default About
