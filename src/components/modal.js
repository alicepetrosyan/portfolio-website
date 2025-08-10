import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "./modal.css";

const modalVariants = {
  hidden: { scale: 0.9, opacity: 0.5 },
  visible: { scale: 1, opacity: 1, transition: { delay: 0.01, duration: 0.05 } },
  exit: {scale: 0.9, opacity: 0 },
};

function Modal({closeModal, title='title', why='why', how='how'}) {
  return (
    <AnimatePresence>
      {closeModal &&
      <div onClick={() => {closeModal(false)}} className='modal-background'>
        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(event) => event.stopPropagation()} className='modal-container'>
          <div className='button-container'>
              <button className='button' onClick={() => {closeModal(false)}}> X </button>
          </div>
          <h className='modal-title'>{title}</h>
          <h1>why?</h1>
          <p>{why}</p>
          <h1>how?</h1>
          <p>{how}</p>
        </motion.div>
      </div>}
    </AnimatePresence>
  )
}

export default Modal
