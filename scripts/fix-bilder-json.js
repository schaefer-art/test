const fs = require('fs');
const path = require('path');

const TECH_MAP = {
  'Rakel / Spachtel': ['Raclette / Spatule', 'Squeegee / Palette knife'],
  'Spray':            ['Spray', 'Spray'],
  'Scratching':       ['Scratching', 'Scratching'],
  'Mischtechnik':     ['Technique mixte', 'Mixed technique'],
  'Wandobjekte':      ['Objets muraux', 'Wall objects'],
};
const TECH_TRANSLATIONS = new Set(Object.values(TECH_MAP).flat());

const bilderPath = path.join(__dirname, '..', 'public', 'data', 'bilder.json');
const bilder = JSON.parse(fs.readFileSync(bilderPath, 'utf8'));

const fixed = bilder.map(group => {
  const tech = group.technique;
  const translations = TECH_MAP[tech] || [tech, tech];
  const fr = translations[0];
  const en = translations[1];
  const works = group.works.map(w => {
    const hasMisc = w.misc && !TECH_TRANSLATIONS.has(String(w.misc));
    return Object.assign({}, w, { misc: hasMisc ? w.misc : null });
  });
  return { technique: tech, technique_fr: fr, technique_en: en, works: works };
});

fs.writeFileSync(bilderPath, JSON.stringify(fixed, null, 2), 'utf8');
console.log('bilder.json saved.');

fixed.forEach(function(g) {
  const real = g.works.filter(function(w) { return w.misc; });
  console.log(g.technique, '| fr:', g.technique_fr, '| en:', g.technique_en, '| works with real misc:', real.length);
});
