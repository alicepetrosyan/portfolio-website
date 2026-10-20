export const HERO_NAME_MODEL_URL =
  process.env.REACT_APP_HERO_NAME_MODEL_URL || '/assets/models/hero_section.draco.glb';

// Local Draco decoder (copied into public/draco from three's examples) so the
// Draco-compressed hero model decodes without a runtime CDN dependency.
export const DRACO_DECODER_PATH = '/draco/';
export const ABOUT_MODEL_URL = process.env.REACT_APP_ABOUT_MODEL_URL || '';
export const FOLDER_MODEL_URL =
  process.env.REACT_APP_FOLDER_MODEL_URL || '/assets/models/folder.glb';