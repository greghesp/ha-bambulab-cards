/*
 * AMS Graphic Card — assets
 *
 * rollup-plugin-img emits these images into dist/images/; the import yields a URL string.
 *
 * Reused from the repo (`src/images/` already ships them):
 *   - ams.png / ams2.png / amsht.png — empty-housing base image per model
 *
 * Added by this card (not in the repo — see the PR description for the reasoning):
 *   - ams-alt.png      AMS base: the shipped ams.png is the **AMS v1 body** (wider outline than
 *                      the AMS 2), while this card is built around an "AMS 2 body + AMS label"
 *                      version, so it is shipped separately
 *   - amsht-clean.png  AMS HT base: the shipped image has fixed humidity / temperature / time
 *                      digits baked into the panel. They are erased here so the card can draw
 *                      live sensor values instead (otherwise the same fake numbers never change)
 *   - ams2pro-mech.png mechanism layer: puts the spool behind the glass / cover
 *   - *-brand.png      silkscreen layer: drawn on top so the logo is never covered by a spool
 */
import AMSImage from "../../images/ams.png";
import AMS2Image from "../../images/ams2.png";
import AMSHTImage from "../../images/amsht.png";
import AMSAltImage from "../../images/ams-alt.png";
import AMSHTCleanImage from "../../images/amsht-clean.png";
import MechImage from "../../images/ams2pro-mech.png";
import BrandAMS2Image from "../../images/ams2pro-brand.png";
import BrandAMSImage from "../../images/ams-brand.png";

export const BASE_IMAGES: { [key: string]: string } = {
  ams: AMSImage,
  ams2: AMS2Image,
  amsht: AMSHTImage,
  amsAlt: AMSAltImage,
  amshtClean: AMSHTCleanImage,
};

export const MECH_IMAGE = MechImage;

export const BRAND_IMAGES: { [key: string]: string } = {
  ams2pro: BrandAMS2Image,
  ams: BrandAMSImage,
};
