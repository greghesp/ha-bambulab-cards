import { css } from "lit";

export default css`

.card {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: var(--card-background-color);
}
#container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%; 
}
.control-container {
    position: relative;
    display: inline-block;
    width: 100%;
    height: 100%;
}
.cover-image {
    position: absolute;
    display: flex;
    transform: translate(-50%, -50%);
    display: flex;
}
.entity {
    position: absolute;
    display: flex;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    align-items: center;
    background-color: rgba(0,0,0,0.3);
    border-radius: 10px;
    box-shadow: 0 0 8px rgba(0,0,0,0.3);
    padding: 6px;
    color: white;
}
#printer {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

`;