import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  location: string;
}

interface MapViewProps {
  stations: Station[];
}

// Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapView = ({ stations }: MapViewProps) => {
  return (
    <MapContainer
      center={[20.5937, 78.9629]}   // India center
      zoom={5}
      scrollWheelZoom
      className="h-[400px] w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
        >
          <Popup>
            <b>{station.name}</b>
            <br />
            {station.location}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
