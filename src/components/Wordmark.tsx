interface WordmarkProps {
  className?: string;
}

/**
 * RESEEPE wordmark — the "SEE" is rendered in the fresh food-green,
 * the rest uses the brand orange (primary).
 */
const Wordmark = ({ className = "text-2xl" }: WordmarkProps) => (
  <span className={`font-bold font-display tracking-tight ${className}`}>
    <span className="text-primary">RE</span>
    <span className="text-fresh">SEE</span>
    <span className="text-primary">PE</span>
  </span>
);

export default Wordmark;
