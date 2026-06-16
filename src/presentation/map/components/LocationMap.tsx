"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { GeoPoint } from "@/src/domain/entities/Place";
import type { MapViewCommand } from "../constants";

interface LocationMapProps {
  initialCenter: GeoPoint;
  initialZoom: number;
  viewCommand: MapViewCommand;
  onCenterChange: (point: GeoPoint) => void;
}

/** Applies imperative recenter commands (search select / locate) onto the map. */
function ViewController({ command }: { command: MapViewCommand }) {
  const map = useMap();

  React.useEffect(() => {
    // version 0 is the initial render — leave MapContainer's own center/zoom alone.
    if (command.version === 0) return;
    map.setView([command.center.latitude, command.center.longitude], command.zoom, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command.version]);

  return null;
}

/** Reports the map centre (the picked coordinate) back to the screen after every move. */
function CenterReporter({ onChange }: { onChange: (point: GeoPoint) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onChange({ latitude: center.lat, longitude: center.lng });
    },
  });

  return null;
}

/** Leaflet mis-measures inside flex containers if they size after init; force a recalc. */
function InvalidateOnMount() {
  const map = useMap();

  React.useEffect(() => {
    map.invalidateSize();
  }, [map]);

  return null;
}

export function LocationMap({ initialCenter, initialZoom, viewCommand, onCenterChange }: LocationMapProps) {
  return (
    <MapContainer
      center={[initialCenter.latitude, initialCenter.longitude]}
      zoom={initialZoom}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <ViewController command={viewCommand} />
      <CenterReporter onChange={onCenterChange} />
      <InvalidateOnMount />
    </MapContainer>
  );
}
