import './projectcards.css';
import SpotlightCard from './SpotlightCard';

function ProjectCards() {
  return (
    <div className='card-container'>
        <SpotlightCard 
            className='project-card' 
            projectName="chaiko (WORK IN PROGRESS)" 
            desc=""
            link='/chaiko'/>
        <SpotlightCard 
            className='project-card' 
            projectName='melodie' 
            link='/melodie'
            desc=""
            img='/images/melodie.jpg'/>
        <SpotlightCard 
            className='project-card' 
            projectName='uwfe rear wing' 
            link='/rear-wing'
            desc=""
            img='/images/rear-wing.jpg'/>
        <SpotlightCard 
            className='project-card' 
            projectName='apex motion servo depositor' 
            link='/servo-depositor'
            desc=""
            img='/images/servo-depositor.jpg'/>
        <SpotlightCard 
            className='project-card' 
            projectName='apex motion tsi nozzles' 
            link='/tsi'
            desc=""
            img='/images/tsi-nozzle.png'/>
        <SpotlightCard 
            className='project-card' 
            projectName='apex motion camera calibration' 
            link='/camera-calibration'
            desc=""/>
    </div>
  );
}

export default ProjectCards;