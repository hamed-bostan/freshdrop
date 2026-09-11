/**
 * The fixed picker pin. It is an overlay anchored to the map's visual centre
 * (not a Leaflet marker), so it stays put while the user pans the map beneath
 * it — the map centre under the tip is the coordinate being chosen.
 */
export function CenterPin() {
  return (
    <div className="pointer-events-none absolute start-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
      <svg width="40" height="40" viewBox="0 0 24 24" className="drop-shadow-md" aria-hidden>
        <path
          className="fill-primary"
          d="M12 0C7.31 0 3.5 3.81 3.5 8.5c0 5.94 7.55 14.4 7.87 14.76a.85.85 0 0 0 1.26 0C12.95 22.9 20.5 14.44 20.5 8.5 20.5 3.81 16.69 0 12 0z"
        />
        <circle className="fill-background" cx="12" cy="8.5" r="3" />
      </svg>
    </div>
  );
}
