import React, { useEffect, useRef, useState } from 'react';
import { HomeAssistant } from '../../types/homeassistant';
import './print-control-card.css';

interface PrintableObject {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  skipped?: boolean;
  to_skip?: boolean;
}

interface PrintControlCardProps {
  hass: HomeAssistant;
  config: {
    printer?: string;
    show_toolbar?: boolean;
    show_preview?: boolean;
  };
}

interface EntityList {
  [key: string]: {
    entity_id: string;
    device_id: string;
  };
}

export const PrintControlCard: React.FC<PrintControlCardProps> = ({ hass, config }) => {
  const [deviceId, setDeviceId] = useState<string>(config.printer || '');
  const [states, setStates] = useState<any>({});
  const [showPopup, setShowPopup] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [entityList, setEntityList] = useState<EntityList>({});
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const visibleCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (deviceId === 'MOCK') {
      Object.keys(hass.devices).forEach((key) => {
        const device = hass.devices[key];
        if (device.manufacturer === 'Bambu Lab') {
          setDeviceId(key);
        }
      });
    }
  }, [hass.devices, deviceId]);

  useEffect(() => {
    setStates(hass.states);
  }, [hass]);

  useEffect(() => {
    if (!deviceId || !hass.entities) return;

    const newEntityList: EntityList = {};
    Object.values(hass.entities)
      .filter(entity => entity.device_id === deviceId)
      .forEach(entity => {
        ['pause', 'stop', 'printable_objects', 'skipped_objects'].forEach(key => {
          if (entity.entity_id.includes(key)) {
            newEntityList[key] = entity;
          }
        });
      });
    setEntityList(newEntityList);
  }, [deviceId, hass.entities]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = visibleCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const objects = states[entityList.printable_objects?.entity_id]?.attributes?.objects || [];
    const clickedObject = objects.find((obj: PrintableObject) => {
      const isInXRange = clickX >= obj.x && clickX <= obj.x + obj.width;
      const isInYRange = clickY >= obj.y && clickY <= obj.y + obj.height;
      return isInXRange && isInYRange;
    });

    if (clickedObject) {
      // Handle object click - could trigger skip object functionality
      setShowPopup(true);
    }
  };

  const handlePauseClick = () => {
    setSelectedAction('pause');
    setIsDialogOpen(true);
  };

  const handleStopClick = () => {
    setSelectedAction('stop');
    setIsDialogOpen(true);
  };

  const clickButton = (entity: { entity_id: string }) => {
    hass.callService('button', 'press', {
      entity_id: entity.entity_id
    });
  };

  const isEntityUnavailable = (entity?: { entity_id: string }): boolean => {
    if (!entity) return true;
    return states[entity.entity_id]?.state === 'unavailable';
  };

  const showSkipButton = (): boolean => {
    const objects = states[entityList.printable_objects?.entity_id]?.attributes?.objects;
    return Array.isArray(objects) && objects.length > 0;
  };

  const enableSkipButton = (): boolean => {
    const skippedObjects = states[entityList.skipped_objects?.entity_id]?.attributes?.objects || [];
    const printableObjects = states[entityList.printable_objects?.entity_id]?.attributes?.objects || [];
    return skippedObjects.length < printableObjects.length;
  };

  const handleActionConfirm = () => {
    if (selectedAction === 'pause') {
      clickButton(entityList.pause);
    } else if (selectedAction === 'stop') {
      clickButton(entityList.stop);
    }
    setIsDialogOpen(false);
  };

  const handleActionCancel = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="card">
      <div className="content">
        <div className="canvas-container">
          <canvas
            ref={hiddenCanvasRef}
            style={{ display: 'none' }}
            width={512}
            height={512}
          />
          <canvas
            ref={visibleCanvasRef}
            onClick={handleCanvasClick}
            width={512}
            height={512}
          />
        </div>
        <div className="controls">
          <button
            className="control-button"
            onClick={handlePauseClick}
            disabled={isEntityUnavailable(entityList.pause)}
          >
            Pause
          </button>
          <button
            className="control-button"
            onClick={handleStopClick}
            disabled={isEntityUnavailable(entityList.stop)}
          >
            Stop
          </button>
          {showSkipButton() && (
            <button
              className="control-button"
              onClick={() => setShowPopup(true)}
              disabled={!enableSkipButton()}
            >
              Skip Objects
            </button>
          )}
        </div>
      </div>
      {isDialogOpen && (
        <div className="dialog">
          <div className="dialog-content">
            <h2>Confirm Action</h2>
            <p>Are you sure you want to {selectedAction}?</p>
            <div className="dialog-buttons">
              <button onClick={handleActionConfirm}>Confirm</button>
              <button onClick={handleActionCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            {/* Add popup content for skipping objects */}
            <button onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}; 