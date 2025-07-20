import './App.css';
import Navbar from './components/navbar'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Home from './components/pages/home';
import Projects from './components/pages/projects';
import Personal from './components/pages/personal';

function App() {
  return (
    <>
    <Router>
      <Navbar />
        <Routes>
          <Route path='/' exact element = {<Home />} />
          <Route path='/projects' exact element = {<Projects />} />          
          <Route path='/personal' exact element = {<Personal />} />
          <Route path='/resume' component={() => {
              window.location.href = 'https://drive.google.com/file/d/1ckAhmDInEoLVuO9TXIOzduwU3NxGzkb1/view?usp=sharing';
              return null;
          }} />
        </Routes>
    </Router>
    </>
  );
}

export default App;
