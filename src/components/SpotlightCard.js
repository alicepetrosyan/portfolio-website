import { useRef } from "react";
import "./SpotlightCard.css";

const SpotlightCard = ({ children, projectName="", link="", desc="poop", img="images/icon-placeholder.jpg", className = "", spotlightColor = "#f39abe53" }) => {
  const divRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    divRef.current.style.setProperty("--mouse-x", `${x}px`);
    divRef.current.style.setProperty("--mouse-y", `${y}px`);
    divRef.current.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`card-spotlight ${className}`}
    >
        <img src={img} />
        <h>{projectName}</h>
        <br />
        <p>{desc}</p>
        <a href={link}>learn more</a>
      {children}
    </div>
  );
};

export default SpotlightCard;
