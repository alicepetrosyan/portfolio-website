import ImageGallery from './imagegallery';
import TypingTitle from './TypingTitle';
import './PersonalSection.css';

function PersonalSection() {
  return (
    <section id="personal" className="section personal-section">
      <TypingTitle className="pixel-title pixel-title--display personal-title" text="personal gallery" />
      <ImageGallery />
    </section>
  );
}

export default PersonalSection;
