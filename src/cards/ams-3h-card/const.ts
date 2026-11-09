import { PREFIX_NAME } from "../../const";

export const AMS_3H_CARD_NAME = `${PREFIX_NAME}-ams-3h-card`;
export const AMS_3H_CARD_EDITOR_NAME = `${AMS_3H_CARD_NAME}-editor`;
// Kept out of AMS_MODELS in src/const.ts: the other AMS cards filter their device pickers by
// that list and can't show nine trays in two zones.
export const AMS_3H_MODEL = "AMS 3H";
