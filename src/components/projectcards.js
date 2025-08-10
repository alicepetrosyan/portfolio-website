import {useState} from "react";
import './projectcards.css';
import SpotlightCard from './SpotlightCard';
import Modal from './modal';
import {projects} from './projectdata';

function ProjectCards() {

  const [openModal1, setOpenModal1] = useState(false)
  const [openModal2, setOpenModal2] = useState(false)
  const [openModal3, setOpenModal3] = useState(false)
  const [openModal4, setOpenModal4] = useState(false)
  const [openModal5, setOpenModal5] = useState(false)
  const [openModal6, setOpenModal6] = useState(false)

 return (
   <div className='card-container'>
       <SpotlightCard 
            onClick={() => {setOpenModal1(true)}}
            className='project-card' 
            projectName={projects[0].name} 
            tools={projects[0].tools}
            desc={projects[0].desc}/>
        {openModal1 && 
        <Modal 
            title={projects[0].name}
            why={projects[0].why}
            how={projects[0].how}
            closeModal={setOpenModal1} />}

        <SpotlightCard 
            onClick={() => {setOpenModal2(true)}}
            className='project-card'  
            projectName={projects[1].name} 
            tools={projects[1].tools}
            desc={projects[1].desc}
            img='/images/melodie.jpg'/>
        {openModal2 && 
        <Modal 
            title={projects[1].name}
            why={projects[1].why}
            how={projects[1].how}
            closeModal={setOpenModal2} />}

        <SpotlightCard 
            onClick={() => {setOpenModal3(true)}}
            className='project-card'  
            projectName={projects[2].name} 
            tools={projects[2].tools}
            desc={projects[2].desc}
            img='/images/rear-wing.jpg'/>
        {openModal3 && 
        <Modal 
            title={projects[2].name}
            why={projects[2].why}
            how={projects[2].how}
            closeModal={setOpenModal3} />}

        <SpotlightCard 
            onClick={() => {setOpenModal4(true)}}
            className='project-card'  
            projectName={projects[3].name} 
            tools={projects[3].tools}
            desc={projects[3].desc}
            img='/images/servo-depositor.jpg'/>
        {openModal4 && 
        <Modal 
            title={projects[3].name}
            why={projects[3].why}
            how={projects[3].how}
            closeModal={setOpenModal4} />}

        <SpotlightCard 
            onClick={() => {setOpenModal5(true)}}
            className='project-card'  
            projectName={projects[4].name} 
            tools={projects[4].tools}
            desc={projects[4].desc}
            img='/images/tsi-nozzle.png'/>
        {openModal5 && 
        <Modal 
            title={projects[4].name}
            why={projects[4].why}
            how={projects[4].how}
            closeModal={setOpenModal5} />}

        <SpotlightCard 
            onClick={() => {setOpenModal6(true)}}
            className='project-card'  
            projectName={projects[5].name} 
            tools={projects[5].tools}
            desc={projects[5].desc} />
        {openModal6 && 
        <Modal 
            title={projects[5].name}
            why={projects[5].why}
            how={projects[5].how}
            closeModal={setOpenModal6} />}
    </div>
  );
}

export default ProjectCards;