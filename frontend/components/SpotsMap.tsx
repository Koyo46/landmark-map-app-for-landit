"use client";

import "leaflet/dist/leaflet.css";

import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, useMapEvents, useMap, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

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

type VisibleSpotWithDistance = Spot & {
  distanceKm: number;
};

type CenterLatLng = {
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
    moveend: () => {
      const center = map.getCenter();
      console.log('中心座標は:', center.lat, center.lng);
    },
  });
  return null;
}

// 画面内に映っているスポットを親に通知する（bounds でフィルタ）
function VisibleSpotsUpdater({
  spots,
  onVisibleChange,
  onCenterChange,
}: {
  spots: Spot[];
  onVisibleChange: (visible: VisibleSpotWithDistance[]) => void;
  onCenterChange: (center: CenterLatLng) => void;
}) {
  const map = useMap();
  const updateVisible = () => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    onCenterChange({ lat: center.lat, lng: center.lng });
    const visible = spots
      .filter((s) => bounds.contains([s.lat, s.lng]))
      .map((s) => ({
        ...s,
        distanceKm: map.distance(center, [s.lat, s.lng]) / 1000,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
    onVisibleChange(visible);
  };
  useEffect(() => {
    updateVisible();
  }, [spots]);
  useMapEvents({ moveend: updateVisible });
  return null;
}

export default function SpotsMap({ spots, className }: Props) {
  const [activeTab, setActiveTab] = useState<"visible" | "radius">("visible");
  const [visibleSpots, setVisibleSpots] = useState<VisibleSpotWithDistance[]>([]);
  const [radiusKm, setRadiusKm] = useState(5);
  const [mapCenter, setMapCenter] = useState<CenterLatLng>({
    lat: 35.681236,
    lng: 139.767125,
  });
  const markerRefs = useRef<Record<number, L.Marker | null>>({});
  const containerClassName =
    (className ?? "") + " flex w-full h-full overflow-hidden";

  const radiusSpots = useMemo(() => {
    const center = L.latLng(mapCenter.lat, mapCenter.lng);
    return spots
      .map((s) => ({
        ...s,
        distanceKm: center.distanceTo([s.lat, s.lng]) / 1000,
      }))
      .filter((s) => s.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [spots, mapCenter, radiusKm]);

  const radiusLabel = radiusKm < 1
    ? `${Math.round(radiusKm * 1000)}m`
    : `${radiusKm.toFixed(1)}km`;

  const handleSpotClick = (spotId: number) => {
    const marker = markerRefs.current[spotId];
    if (!marker) return;
    marker.openPopup();
  };

  return (
    <div className={containerClassName}>
      {/* 左サイドバー（幅384px固定） */}
      <div className="w-96 shrink-0 bg-white border-r flex flex-col min-h-0 z-[1000] shadow-md relative">
        <div className="p-4 border-b space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              中心地点の住所
              <img
                src="/center-pin.svg"
                alt="Center Pin"
                className="h-4 w-4 drop-shadow-md inline-block"
              />：
              <span className="text-slate-900">
                {/* TODO: 逆ジオコーディングで住所を表示 */}
              </span>
            </span>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "visible" | "radius")}
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="visible"
                className="text-slate-500 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold"
              >
                画面内のスポット
              </TabsTrigger>
              <TabsTrigger
                value="radius"
                className="text-slate-500 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold"
              >
                周辺検索
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="visible" className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0">
            <div className="px-4 py-2 text-sm font-semibold text-slate-500">
              表示中のスポット ({visibleSpots.length}件)
            </div>
            <ScrollArea className="flex-1 min-h-0 px-4 pb-4">
              <ul className="space-y-2">
                {visibleSpots.map((s) => (
                  <li
                    key={s.id}
                    className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <button
                      type="button"
                      onClick={() => handleSpotClick(s.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold text-black">{s.name}</div>
                        <div className="shrink-0 text-xs text-slate-500">
                          {s.distanceKm < 1
                            ? `${Math.round(s.distanceKm * 1000)} m`
                            : `${s.distanceKm.toFixed(2)} km`}
                        </div>
                      </div>
                      {s.category && (
                        <div className="text-xs text-slate-500 mt-1">
                          {s.category}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="radius" className="flex-1 min-h-0 overflow-hidden flex flex-col px-4 pb-4 pt-1 mt-0">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <input
                type="range"
                min={0.5}
                max={500}
                step={0.5}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-slate-800"
              />
              <div className="mt-2 text-sm font-semibold text-slate-700">
                半径{radiusLabel}以内のスポット ({radiusSpots.length}件)
              </div>
            </div>

            <ScrollArea className="mt-3 flex-1 min-h-0 pr-1">
              <ul className="space-y-2 pr-3">
                {radiusSpots.map((s) => (
                  <li
                    key={s.id}
                    className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <button
                      type="button"
                      onClick={() => handleSpotClick(s.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold text-black">{s.name}</div>
                        <div className="shrink-0 text-xs text-slate-500">
                          {s.distanceKm < 1
                            ? `${Math.round(s.distanceKm * 1000)} m`
                            : `${s.distanceKm.toFixed(2)} km`}
                        </div>
                      </div>
                      {s.category && (
                        <div className="text-xs text-slate-500 mt-1">
                          {s.category}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* 右マップエリア（残り全幅を占有） */}
      <div className="flex-1 relative min-w-0">
        <MapContainer
          center={defaultCenter}
          zoom={11}
          scrollWheelZoom="center"
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {activeTab === "radius" && (
            <Circle
              center={[mapCenter.lat, mapCenter.lng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#3b82f6",
                fillOpacity: 0.12,
                weight: 2,
              }}
            />
          )}
          {spots.map((spot) => (
            <Marker
              key={spot.id}
              ref={(marker) => {
                markerRefs.current[spot.id] = marker;
              }}
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
          <VisibleSpotsUpdater
            spots={spots}
            onVisibleChange={setVisibleSpots}
            onCenterChange={setMapCenter}
          />
        </MapContainer>

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000]">
          <img
            src="/center-pin.svg"
            alt="Center Pin"
            className="h-10 w-10 drop-shadow-md"
          />
        </div>
      </div>
    </div>
  );
}
