import React, { useEffect, useState } from "react";
import { HomeAssistant, Entity } from "../../types/homeassistant";
import { Spool } from "../shared-components/spool";
import { registerCustomCard } from "../../utils/custom-cards";
import { AMS_CARD_NAME } from "./const";
import "./ams-card.css";

interface AMSCardProps {
  hass: HomeAssistant;
  config?: {
    device_id?: string;
    title?: string;
    style?: "graphic" | "vector";
    show_info_bar?: boolean;
  };
}

interface TrayData {
  active: boolean;
  empty: boolean;
  color: string;
  name: string;
}

export const AMSCard: React.FC<AMSCardProps> = ({ hass, config }) => {
  const [trays, setTrays] = useState<TrayData[]>([]);

  useEffect(() => {
    console.log(config, hass);
    if (!config?.device_id || !hass.entities) return;
    console.log(hass.entities);

    const entities = Object.values(hass.entities)
      .filter((entity): entity is Entity => {
        if (!entity || typeof entity !== "object") return false;
        return (
          "device_id" in entity &&
          "entity_id" in entity &&
          typeof entity.device_id === "string" &&
          typeof entity.entity_id === "string" &&
          entity.device_id === config.device_id &&
          entity.entity_id.includes("tray")
        );
      })
      .sort((a, b) => a.entity_id.localeCompare(b.entity_id));

    const trayData = entities.map((entity) => {
      const state = hass.states[entity.entity_id];
      return {
        active: state?.state === "active",
        empty: state?.state === "unavailable",
        color: state?.attributes?.color || "#808080",
        name: state?.attributes?.friendly_name || "Unknown",
      };
    });

    setTrays(trayData);
  }, [hass.entities, hass.states, config?.device_id]);

  console.log(trays);

  if (trays.length === 0) {
    return null;
  }

  return (
    <div className="card">
      {config?.title && <h2 className="title">{config.title}</h2>}
      <div className="spools">
        {trays.map((tray, index) => (
          <Spool
            key={`spool-${index}`}
            trayId={index}
            active={tray.active}
            empty={tray.empty}
            color={tray.color}
            name={tray.name}
          />
        ))}
      </div>
    </div>
  );
};

// Register the custom card after component definition
registerCustomCard({
  type: AMS_CARD_NAME,
  name: "Bambu Lab AMS Card",
  description: "AMS card for Bambu Lab Printers",
  component: AMSCard,
  getStubConfig: () => ({
    device_id: "",
    title: "AMS",
    style: "vector",
    show_info_bar: true,
  })
});
