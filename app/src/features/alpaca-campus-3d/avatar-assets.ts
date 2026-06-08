import playerAlpacaBaseSrc from "../../../assets/campus-3d/avatars/player-alpaca/player-alpaca-base.glb?url";
import beigeTextureSrc from "../../../assets/campus-3d/avatars/player-alpaca/textures/player-alpaca-beige.webp?url";
import blackTextureSrc from "../../../assets/campus-3d/avatars/player-alpaca/textures/player-alpaca-black.webp?url";
import blondeTextureSrc from "../../../assets/campus-3d/avatars/player-alpaca/textures/player-alpaca-blonde.webp?url";
import brownTextureSrc from "../../../assets/campus-3d/avatars/player-alpaca/textures/player-alpaca-brown.webp?url";
import lightBlueTextureSrc from "../../../assets/campus-3d/avatars/player-alpaca/textures/player-alpaca-light-blue.webp?url";
import lightBrownTextureSrc from "../../../assets/campus-3d/avatars/player-alpaca/textures/player-alpaca-light-brown.webp?url";
import lightGreenTextureSrc from "../../../assets/campus-3d/avatars/player-alpaca/textures/player-alpaca-light-green.webp?url";
import lightPinkTextureSrc from "../../../assets/campus-3d/avatars/player-alpaca/textures/player-alpaca-light-pink.webp?url";
import lightPurpleTextureSrc from "../../../assets/campus-3d/avatars/player-alpaca/textures/player-alpaca-light-purple.webp?url";
import redhairTextureSrc from "../../../assets/campus-3d/avatars/player-alpaca/textures/player-alpaca-redhair.webp?url";

export type PlayerAlpacaVariantId =
  | "light-brown"
  | "brown"
  | "light-blue"
  | "light-green"
  | "blonde"
  | "black"
  | "beige"
  | "redhair"
  | "light-pink"
  | "light-purple";

export type PlayerAlpacaVariant = {
  id: PlayerAlpacaVariantId;
  name: string;
  wool: string;
  accent: string;
  textureSrc: string;
};

const PLAYER_ALPACA_ASSET_VERSION = "clean-base-distance-gait-sit-displacement-v8";

function withAssetVersion(src: string): string {
  return `${src}${src.includes("?") ? "&" : "?"}v=${PLAYER_ALPACA_ASSET_VERSION}`;
}

export const PLAYER_ALPACA_MODEL_SRC = withAssetVersion(playerAlpacaBaseSrc);
export const DEFAULT_PLAYER_ALPACA_VARIANT_ID: PlayerAlpacaVariantId = "light-brown";

export const PLAYER_ALPACA_VARIANTS: PlayerAlpacaVariant[] = [
  { id: "light-brown", name: "Light Brown", wool: "#bc8452", accent: "#f3d39a", textureSrc: lightBrownTextureSrc },
  { id: "brown", name: "Brown", wool: "#6a4027", accent: "#d8a568", textureSrc: brownTextureSrc },
  { id: "light-blue", name: "Light Blue", wool: "#6cabd6", accent: "#d8f3ff", textureSrc: lightBlueTextureSrc },
  { id: "light-green", name: "Light Green", wool: "#74b77e", accent: "#e6f8d9", textureSrc: lightGreenTextureSrc },
  { id: "blonde", name: "Blonde", wool: "#dbba63", accent: "#fff0ba", textureSrc: blondeTextureSrc },
  { id: "black", name: "Black", wool: "#25272a", accent: "#f2cc8f", textureSrc: blackTextureSrc },
  { id: "beige", name: "Beige", wool: "#d5b587", accent: "#fff4d8", textureSrc: beigeTextureSrc },
  { id: "redhair", name: "Redhair", wool: "#b15230", accent: "#ffd0a3", textureSrc: redhairTextureSrc },
  { id: "light-pink", name: "Light Pink", wool: "#e28eab", accent: "#ffe0ec", textureSrc: lightPinkTextureSrc },
  { id: "light-purple", name: "Light Purple", wool: "#a78ed9", accent: "#f0e5ff", textureSrc: lightPurpleTextureSrc }
];

export const PLAYER_ALPACA_TEXTURES: Record<PlayerAlpacaVariantId, string> = Object.fromEntries(
  PLAYER_ALPACA_VARIANTS.map((variant) => [variant.id, variant.textureSrc])
) as Record<PlayerAlpacaVariantId, string>;

export function getPlayerAlpacaTextureSrc(variantId: string | undefined): string {
  return PLAYER_ALPACA_TEXTURES[(variantId || DEFAULT_PLAYER_ALPACA_VARIANT_ID) as PlayerAlpacaVariantId]
    || PLAYER_ALPACA_TEXTURES[DEFAULT_PLAYER_ALPACA_VARIANT_ID];
}
