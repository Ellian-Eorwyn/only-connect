import { Hieroglyph } from '../types';
import twoReeds from '../assets/hieroglyphs/two-reeds.svg';
import lion from '../assets/hieroglyphs/lion.svg';
import twistedFlax from '../assets/hieroglyphs/twisted-flax.svg';
import hornedViper from '../assets/hieroglyphs/horned-viper.svg';
import water from '../assets/hieroglyphs/water.svg';
import eyeOfHorus from '../assets/hieroglyphs/eye-of-horus.svg';

// The six hieroglyph designs (white line-art, navy background removed so they
// sit on the app's own tiles).
const SRC: Record<Hieroglyph, string> = {
  'two-reeds': twoReeds,
  lion,
  'twisted-flax': twistedFlax,
  'horned-viper': hornedViper,
  water,
  'eye-of-horus': eyeOfHorus,
};

export function HieroglyphIcon({ name }: { name: Hieroglyph }) {
  return <img className="oc-hiero-art" src={SRC[name]} alt="" draggable={false} />;
}
