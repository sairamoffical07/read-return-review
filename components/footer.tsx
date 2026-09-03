/* eslint-disable @next/next/no-img-element */
function InstagramIcon({ className = "instagram-icon" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand-section">
          <div className="footer-logos">
            <img
              src="/logos/enlit-logo.png"
              alt="ENLIT Logo"
              className="footer-logo enlit-logo"
            />
            <span className="footer-logo-divider" aria-hidden="true" />
            <img
              src="/logos/eec-logo.png"
              alt="Easwari Engineering College Logo"
              className="footer-logo college-logo"
            />
          </div>
          <div className="footer-motto">
            <span>READ · RETURN · REVIEW</span>
            <p>One book. One reader. One reel. Pass it on.</p>
          </div>
        </div>
        <div className="footer-social-section">
          <a
            href="https://www.instagram.com/enlit.eec/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit ENLIT on Instagram"
            className="footer-instagram-link"
          >
            <InstagramIcon className="instagram-icon" />
            <span>@ENLIT.EEC</span>
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 ENLIT — The Literary Club, Easwari Engineering College. All rights reserved.</p>
      </div>
    </footer>
  );
}
