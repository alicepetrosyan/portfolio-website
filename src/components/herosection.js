import './herosection.css';
import React, { useRef } from "react";
import {motion, transform, useScroll, useTransform} from 'framer-motion';

function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end start"],
  });
  const frameY = useTransform(scrollYProgress, [0,0.8], ["0vh","90vh"]);
  const videoTransform = useTransform(scrollYProgress, [0, 1],["rotateX(20deg)translateY(0vw)", "rotateX(-80deg) translateY(175vh)"]);

  return (
    <div className='hero-container'>
      <div className='parallax'>
        <motion.p className='title' style={{ y: frameY }}>ALICE PETROSYAN</motion.p>
        <motion.img className='frame' src='images/camera-frame-3.png' style={{ y: frameY }}/>
        <motion.video className='animation' src='videos/placeholder-video.mp4' style={{ transform:videoTransform }} loop='true' muted='true' autoPlay='true'/>
      </div>
    </div>
  );
}

export default HeroSection;
