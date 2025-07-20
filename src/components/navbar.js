import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import './navbar.css';

function Navbar() {
  const [click, setClick] = useState(false);
  
  const handleClick = () => {
    setClick(!click);
    const audio = new Audio('sounds/pop_sound_effect.mp3');
    audio.volume = 0.5;
    audio.play();
  }

  const closeMobileMenu = () => {
    setClick(false);
    const audio = new Audio('sounds/pop_sound_effect.mp3');
    audio.volume = 0.5;
    audio.play();
  }

  return (
    <>
    <nav className="navbar">
      <div className="navbar-container">
        <div className='menu-icon' onClick={handleClick}>
          <i className={click ? 'fas fa-times' : 'fas fa-bars'}/>
        </div>
        <ul className={click ? 'nav-menu active' : 'nav-menu'}>
          <li className = 'nav-item'>
            <Link to='/' className="nav-links" onClick={closeMobileMenu}>
            home
            </Link>
          </li>
          <li className = 'nav-item'>
            <Link to='/projects' className="nav-links" onClick={closeMobileMenu}>
            projects
            </Link>
          </li>
          <li className = 'nav-item'>
            <Link to='/personal' className="nav-links" onClick={closeMobileMenu}>
            personal
            </Link>
          </li>
          <li className = 'nav-item'>
            <a href="https://drive.google.com/file/d/1ckAhmDInEoLVuO9TXIOzduwU3NxGzkb1/view" target="_blank" className="nav-links" onClick={closeMobileMenu}>
            resume
            </a>
          </li>
        </ul>
      </div>
    </nav>
    </>
  );
}

export default Navbar;