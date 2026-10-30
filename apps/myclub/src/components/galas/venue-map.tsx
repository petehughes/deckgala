interface VenueMapProps {
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

export function VenueMap({
  name,
  addressLine1,
  addressLine2,
  city,
  postcode,
  country = "United Kingdom",
  latitude,
  longitude,
  notes,
}: VenueMapProps) {
  const addressParts = [addressLine1, addressLine2, city, postcode, country].filter(Boolean);
  const fullAddress = addressParts.join(", ");

  // Default coordinates (e.g. Ponds Forge Sheffield / national pool fallback) if not supplied
  const lat = latitude ?? 53.3831;
  const lon = longitude ?? -1.4627;
  const delta = 0.005;

  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik&marker=${lat}%2C${lon}`;

  const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${lat}%2C${lon}#map=16/${lat}/${lon}`;
  const externalMapSearchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(
    `${name} ${fullAddress}`,
  )}`;

  return (
    <div className="venue-map-card">
      <div className="venue-map-details">
        <div>
          <span className="eyebrow">Competition Venue</span>
          <h3 className="venue-name">{name}</h3>
          {fullAddress && <p className="venue-address">{fullAddress}</p>}
        </div>

        {notes && (
          <div className="venue-notes">
            <span className="venue-notes-label">Spectator & Parking Notes:</span>
            <p>{notes}</p>
          </div>
        )}

        <div className="venue-links">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button-secondary"
            style={{ fontSize: "11px", textDecoration: "none" }}
          >
            🗺️ Open Directions
          </a>
          <a
            href={externalMapSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="header-link"
            style={{ fontSize: "11px" }}
          >
            View on OpenStreetMap ↗
          </a>
        </div>
      </div>

      <div className="venue-map-viewport">
        <iframe
          title={`Map of ${name}`}
          src={embedUrl}
          className="venue-map-iframe"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="venue-map-badge">OpenStreetMap</div>
      </div>
    </div>
  );
}

