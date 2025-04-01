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

  #image-container {
    position: relative;
    display: block;
    padding-bottom: 10px;
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

  .popup-content {
    font-size: 14px;
    display: flex;
    flex-direction: column;
    min-width: 256px;
    overflow: auto;
  }
`;
