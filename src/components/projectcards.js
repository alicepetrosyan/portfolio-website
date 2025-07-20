import './projectcards.css';
import SpotlightCard from './SpotlightCard';

function ProjectCards() {
  return (
    <div className='card-container'>
        <SpotlightCard 
            className='project-card' 
            projectName="chaiko: a barista's best friend" 
            link='/chaiko'/>
        <SpotlightCard 
            className='project-card' 
            projectName='melodie' 
            link='/melodie'/>
        <SpotlightCard 
            className='project-card' 
            projectName='uwfe rear wing design' 
            link='/rear-wing'/>
        <SpotlightCard 
            className='project-card' 
            projectName='apex motion servo depositor' 
            link='/servo-depositor'/>
        <SpotlightCard 
            className='project-card' 
            projectName='apex motion TSI Nozzles' 
            link='/tsi'/>
        <SpotlightCard 
            className='project-card' 
            projectName='apex motion camera calibration' 
            link='/camera-calibration'/>
    </div>
  );
}

export default ProjectCards;