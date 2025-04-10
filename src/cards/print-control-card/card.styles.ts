import { css } from "lit";

export default css`

#build-plate {
  display: block;
  width: 100%;
  height: auto;
  min-width: 256px;
  max-width: 512px;
  z-index: 1;
}
.button {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}
.buttons-container {
  display: flex;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 4px;
  width: 100%;
  overflow: hidden;
}
#canvas {
  position: absolute;
  left: 0;
  top: 2.5%;
  width: 100%;
  height: auto;
  min-width: 256px;
  max-width: 512px;
  z-index: 2;
}
.card {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 9px 8px;
  background: var(--card-background-color);
}
.checkbox-list {
  padding: 0;
  overflow-y: auto;    
  display: flex;
  flex-wrap: wrap;
  min-height: 20px;
  max-height: 220px;
  width: 100%;
  max-width: 100%;
  flex-shrink: 1;
}
.checkbox-object {
  width: calc(50% - 10px);
  align-items: left;
}
.control-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}
.ha-button {
  display: flex;
  flex: 1 1 auto;
  min-width: 30px;
  max-width: 64px;
  align-items: center;
  justify-content: center;
}
#image-container {
  position: relative;
  display: block;
  padding-bottom: 10px;
}
.popup {
  position: fixed;
  display: flex;
  flex-direction: column;
  top: 50%;
  left: 50%;
  width: 100%;
  max-width: min(calc(100vw - 70px), 512px);
  max-height: calc(90vh - 90px);
  transform: translate(-50%,-50%);
  background-color: var(--card-background-color, white);
  padding: 10px;
  border: 1px solid #ccc;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow-y: auto;
  z-index: 1000;
}
.popup-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
.popup-button-container {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  gap: 10px;
}
.popup-header {
  font-size: 18px;
  margin-bottom: 10px;
}
.popup-content {
  font-size: 14px;
  display: flex;
  flex-direction: column; 
  min-width: 256px;
  overflow: auto;
}
#speed {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
#speed ha-icon {
  margin-right: 8px;
}

`;