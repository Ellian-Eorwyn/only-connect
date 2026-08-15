// Bundled media for the built-in example game (extracted from the OCDB archive
// of "Sinistrals v Merseyside Eyes"). Imported so "Load example game" works in
// one click with no media folder needed. Vite inlines these in the single-file
// build.
import p1 from './s22e3p1.png';
import p2 from './s22e3p2.png';
import p3 from './s22e3p3.png';
import p4 from './s22e3p4.png';
import p5 from './s22e3p5.png';
import p6 from './s22e3p6.png';
import p7 from './s22e3p7.png';
import m1 from './s22e3m1.mp3';
import m2 from './s22e3m2.mp3';
import m3 from './s22e3m3.mp3';
import m4 from './s22e3m4.mp3';

export const EXAMPLE_MEDIA: Record<string, string> = {
  's22e3p1.png': p1,
  's22e3p2.png': p2,
  's22e3p3.png': p3,
  's22e3p4.png': p4,
  's22e3p5.png': p5,
  's22e3p6.png': p6,
  's22e3p7.png': p7,
  's22e3m1.mp3': m1,
  's22e3m2.mp3': m2,
  's22e3m3.mp3': m3,
  's22e3m4.mp3': m4,
};
