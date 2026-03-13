"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, useMapEvents, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";

const iconSize: [number, number] = [40, 40];
const iconAnchor: [number, number] = [20, 40];

const defaultIcon = L.icon({
  iconUrl: "/marker.svg",
  iconSize,
  iconAnchor,
});

const sightseeingIcon = L.icon({
  iconUrl: "/sightseeing.svg",
  iconSize,
  iconAnchor,
});

const natureIcon = L.icon({
  iconUrl: "/nature.svg",
  iconSize,
  iconAnchor,
});

const getIconForCategory = (category: string | null) => {
  if (!category) return defaultIcon;
  const normalized = category.toLowerCase();

  if (normalized.includes("観光名所")) {
    return sightseeingIcon;
  }

  if (normalized.includes("自然景観")) {
    return natureIcon;
  }

  return defaultIcon;
};

type Spot = {
  id: number;
  name: string;
  category: string | null;
  address: string | null;
  lat: number;
  lng: number;
};

type Props = {
  spots: Spot[];
  className?: string;
};

// 初期位置：東京駅あたり
const defaultCenter: LatLngExpression = [35.681236, 139.767125];

function MapCenterObserver() {
  const map = useMapEvents({
    // 地図の移動が終わった瞬間に発火
    moveend: () => {
      // 現在の中心座標を取得
      const center = map.getCenter();
      console.log('中心座標は:', center.lat, center.lng);
      
    },
  });

  // このコンポーネント自体は画面に何も描画しないので null を返す
  return null; 
}

export default function SpotsMap({ spots, className }: Props) {
  const containerClassName =
    (className ?? "") + " relative w-full h-[calc(100vh-5rem)]";
  const mapClassName = "w-full h-full";

  return (
    <div className={containerClassName}>
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom
        className={mapClassName}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={getIconForCategory(spot.category)}
          >
            <Popup>
              <div className="font-semibold">{spot.name}</div>
              {spot.category && (
                <div className="text-xs text-slate-600">
                  カテゴリ: {spot.category}
                </div>
              )}
              {spot.address && (
                <div className="text-xs text-slate-600">{spot.address}</div>
              )}
            </Popup>
          </Marker>
          ))}
        <MapCenterObserver />
        </MapContainer>
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-[1000]">
        <img src="/center-pin.svg" alt="Center Pin" className="h-10 w-10" />
      </div>
    </div>
  );
}
