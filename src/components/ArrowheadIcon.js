// Pixel-art arrowhead that points right by default. Callers rotate it via CSS.
// Uses currentColor so it inherits text color, and crisp edges for the pixel look.
function ArrowheadIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="5" y="1" width="2" height="2" />
      <rect x="7" y="3" width="2" height="2" />
      <rect x="9" y="5" width="2" height="2" />
      <rect x="11" y="7" width="2" height="2" />
      <rect x="9" y="9" width="2" height="2" />
      <rect x="7" y="11" width="2" height="2" />
      <rect x="5" y="13" width="2" height="2" />
    </svg>
  );
}

export default ArrowheadIcon;
