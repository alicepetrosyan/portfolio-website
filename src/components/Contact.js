import './Contact.css';
import TypingTitle from './TypingTitle';

// PDFs are hosted on Google Drive. From a share link
// (drive.google.com/file/d/<ID>/view) we derive the embeddable preview URL for
// the inline iframe and the direct-download URL for the download link.
const DOCS = {
  resume: '1tTgGmfl9Orgf-bUwXKfatsFMXYWq_XPp',
  portfolio: '1AxGWlM22KzcdFSdg07y7JXS0xIDwPtO_',
};
const drivePreview = (id) => `https://drive.google.com/file/d/${id}/preview`;
const driveDownload = (id) => `https://drive.google.com/uc?export=download&id=${id}`;

const LINKS = [
  { href: 'mailto:alicepetrosyan05@gmail.com', label: 'Email', icon: 'fa-solid fa-envelope' },
  { href: 'https://github.com/alicepetrosyan', label: 'GitHub', icon: 'fa-brands fa-github', external: true },
  { href: 'https://www.linkedin.com/in/alice-petrosyan', label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', external: true },
];

function PdfPanel({ title, fileId }) {
  return (
    <article className="pdf-panel">
      <div className="pdf-heading">
        <TypingTitle as="h3" className="pixel-title" text={title} />
        <a className="pdf-download" href={driveDownload(fileId)} target="_blank" rel="noreferrer">
          download pdf
        </a>
      </div>
      <iframe
        title={title}
        src={drivePreview(fileId)}
        className="pdf-frame"
        loading="lazy"
        allow="autoplay"
      />
    </article>
  );
}

function Contact() {
  return (
    <section id="contact" className="section contact-section">
      <TypingTitle className="pixel-title contact-title" text="contact" />
      <div className="pdf-row">
        <PdfPanel title="resume" fileId={DOCS.resume} />
        <PdfPanel title="portfolio" fileId={DOCS.portfolio} />
      </div>
      <div className="social-row">
        {LINKS.map((link) => (
          <a
            key={link.label}
            className="social-icon"
            href={link.href}
            aria-label={link.label}
            {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            <i className={link.icon} />
          </a>
        ))}
      </div>
    </section>
  );
}

export default Contact;
