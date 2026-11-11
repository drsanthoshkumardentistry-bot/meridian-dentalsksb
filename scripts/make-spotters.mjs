// Generates schematic spotter illustrations into public/spotters/*.svg
// These are teaching schematics, not real patient images.
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('../public/spotters/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const W = 480, H = 320
const wrap = (body, defs = '', bg = '#000') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .18 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="soft"><feGaussianBlur stdDeviation="1.4"/></filter>
<filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
<radialGradient id="bone" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#9a9a9a"/><stop offset="1" stop-color="#5c5c5c"/></radialGradient>
<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".45" stop-color="#a9b3bd"/><stop offset="1" stop-color="#6b7682"/></linearGradient>
<linearGradient id="steelH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b7682"/><stop offset=".5" stop-color="#eef1f4"/><stop offset="1" stop-color="#7d8894"/></linearGradient>
${defs}
</defs>
<rect width="${W}" height="${H}" fill="${bg}"/>
${body}
<text x="${W - 8}" y="${H - 8}" text-anchor="end" font-family="sans-serif" font-size="10" fill="${bg === '#000' || bg === '#0b0b0b' ? '#888' : '#8a6f7a'}" opacity=".8">Schematic</text>
</svg>`

// A radiographic tooth: crown (enamel bright), roots, pulp.
function tooth(x, y, { w = 44, crown = 34, root = 60, roots = 2, rot = 0, rootCut = 0, caries = false } = {}) {
  const r = []
  const rootW = roots === 1 ? w * 0.5 : w * 0.34
  const rl = root - rootCut
  for (let i = 0; i < roots; i++) {
    const cx = roots === 1 ? 0 : (i === 0 ? -w * 0.24 : w * 0.24)
    r.push(`<path d="M ${cx - rootW / 2} 0 L ${cx - rootW / 4} ${rl} ${rootCut ? `L ${cx + rootW / 4} ${rl - 4}` : `Q ${cx} ${rl + 6} ${cx + rootW / 4} ${rl}`} L ${cx + rootW / 2} 0 Z" fill="#c4c4c4"/>`)
    r.push(`<path d="M ${cx} 2 L ${cx} ${rl - 6}" stroke="#4a4a4a" stroke-width="3" stroke-linecap="round"/>`)
  }
  const crownP = `<path d="M ${-w / 2} 0 Q ${-w / 2 - 3} ${-crown * 0.6} ${-w / 2 + 6} ${-crown} Q 0 ${-crown - 8} ${w / 2 - 6} ${-crown} Q ${w / 2 + 3} ${-crown * 0.6} ${w / 2} 0 Z" fill="#ececec"/>`
  const pulp = `<path d="M ${-w * 0.22} -4 Q 0 ${-crown * 0.55} ${w * 0.22} -4 Z" fill="#555"/>`
  const car = caries ? `<path d="M ${-w * 0.15} ${-crown - 2} Q 0 ${-crown * 0.35} ${w * 0.25} ${-crown + 2} Z" fill="#2a2a2a"/>` : ''
  return `<g transform="translate(${x} ${y}) rotate(${rot})">${r.join('')}${crownP}${pulp}${car}</g>`
}

const files = {}

// ---------- RADIOGRAPHS ----------
const mandible = `<path d="M 20 150 Q 60 120 210 128 L 330 128 Q 360 120 370 70 L 385 20 Q 420 10 440 30 L 430 120 Q 425 230 380 260 Q 250 300 40 272 Q 15 240 20 150 Z" fill="url(#bone)"/>
<path d="M 30 255 Q 220 285 375 245" stroke="#bdbdbd" stroke-width="7" fill="none" opacity=".55"/>`

files['r-ameloblastoma'] = wrap(`${mandible}
${tooth(70, 150, { roots: 1, w: 34 })}${tooth(118, 150, { roots: 1, w: 36 })}${tooth(172, 150, { w: 50, rootCut: 0 })}${tooth(232, 150, { w: 50, rootCut: 22 })}
<g filter="url(#soft)">
<path d="M 255 160 Q 250 250 300 262 Q 360 268 395 230 Q 420 170 405 110 Q 370 95 330 120 Q 290 130 255 160 Z" fill="#262626"/>
<g stroke="#8c8c8c" stroke-width="3" fill="none">
<path d="M 300 150 Q 320 195 302 255"/><path d="M 350 118 Q 335 170 370 210 Q 380 240 360 262"/><path d="M 268 205 Q 300 200 335 225"/><path d="M 340 160 Q 375 160 405 150"/><path d="M 372 205 Q 395 205 412 200"/>
</g></g>
<path d="M 255 160 Q 250 250 300 262 Q 360 268 395 230 Q 420 170 405 110" stroke="#cfcfcf" stroke-width="2" fill="none" opacity=".7"/>
<rect width="${W}" height="${H}" filter="url(#grain)"/>`)

const film = (inner) => wrap(`<rect x="70" y="10" width="340" height="300" rx="22" fill="url(#bone)"/>${inner}<rect x="70" y="10" width="340" height="300" rx="22" fill="none" stroke="#222" stroke-width="6"/><rect width="${W}" height="${H}" filter="url(#grain)"/>`, '', '#0b0b0b')

files['r-radicular-cyst'] = film(`
${tooth(140, 120, { roots: 1, w: 46, crown: 70, root: 140 })}${tooth(250, 120, { roots: 1, w: 50, crown: 70, root: 130, caries: true })}${tooth(360, 120, { roots: 1, w: 46, crown: 70, root: 140 })}
<circle cx="250" cy="270" r="40" fill="#272727" filter="url(#soft)"/><circle cx="250" cy="270" r="40" fill="none" stroke="#d6d6d6" stroke-width="2.5"/>
<path d="M 117 120 L 112 262" stroke="#d9d9d9" stroke-width="2" opacity=".6"/><path d="M 383 120 L 388 262" stroke="#d9d9d9" stroke-width="2" opacity=".6"/>`)

files['r-dentigerous-cyst'] = wrap(`${mandible}
${tooth(110, 150, { w: 50 })}${tooth(172, 150, { w: 52 })}${tooth(236, 150, { w: 52 })}
<ellipse cx="322" cy="168" rx="62" ry="54" fill="#262626" filter="url(#soft)"/><ellipse cx="322" cy="168" rx="62" ry="54" fill="none" stroke="#d6d6d6" stroke-width="2.5"/>
${tooth(322, 182, { w: 54, crown: 40, root: 52, rot: -35 })}
<rect width="${W}" height="${H}" filter="url(#grain)"/>`)

const spicules = Array.from({ length: 26 }, (_, i) => {
  const a = Math.PI * (0.05 + (i / 25) * 0.9) + Math.PI
  const r1 = 62, r2 = 112 + (i % 3) * 14
  return `<line x1="${240 + Math.cos(a) * r1}" y1="${190 + Math.sin(a) * r1}" x2="${240 + Math.cos(a) * r2}" y2="${190 + Math.sin(a) * r2}" stroke="#e2e2e2" stroke-width="${1.6 + (i % 2)}" opacity=".85"/>`
}).join('')
files['r-osteosarcoma'] = wrap(`<rect x="0" y="150" width="${W}" height="170" fill="url(#bone)"/>
<g filter="url(#soft)">${spicules}</g>
<path d="M 170 150 Q 200 110 240 120 Q 290 112 315 150 Q 330 200 290 230 Q 240 250 190 225 Q 160 200 170 150 Z" fill="#3a3a3a" opacity=".85" filter="url(#blur4)"/>
${tooth(130, 170, { roots: 1, w: 34, crown: 30, root: 70 })}${tooth(350, 170, { roots: 1, w: 34, crown: 30, root: 70 })}
<rect width="${W}" height="${H}" filter="url(#grain)"/>`)

files['r-fibrous-dysplasia'] = wrap(`${mandible}
<defs><filter id="gg"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 .78  0 0 0 0 .78  0 0 0 0 .78  0 0 0 .55 0"/></filter>
<radialGradient id="fade"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="m"><ellipse cx="230" cy="200" rx="150" ry="80" fill="url(#fade)"/></mask></defs>
<g mask="url(#m)"><ellipse cx="230" cy="200" rx="150" ry="80" fill="#a8a8a8"/><rect x="60" y="110" width="340" height="180" filter="url(#gg)"/></g>
${tooth(150, 140, { w: 46 })}${tooth(212, 138, { w: 48, rot: 6 })}${tooth(274, 142, { w: 48, rot: 10 })}
<rect width="${W}" height="${H}" filter="url(#grain)"/>`)

// ---------- HISTOLOGY (H&E) ----------
const HE_BG = '#f7dbe6'
const stroma = (seed = 1) => Array.from({ length: 34 }, (_, i) => {
  const y = (i * 9.7 + seed * 13) % H, x = ((i * 53 + seed * 31) % W)
  return `<path d="M ${x - 60} ${y} q 30 -8 60 0 t 60 0" stroke="#e7a9c2" stroke-width="2" fill="none" opacity=".7"/>`
}).join('') + Array.from({ length: 60 }, (_, i) => `<ellipse cx="${(i * 71 + seed * 17) % W}" cy="${(i * 37 + seed * 7) % H}" rx="4" ry="1.6" fill="#7a3f8f" opacity=".55" transform="rotate(${i * 23} ${(i * 71 + seed * 17) % W} ${(i * 37 + seed * 7) % H})"/>`).join('')

function island(cx, cy, rx, ry) {
  const n = Math.round((rx + ry) / 3.2)
  const pal = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const x = cx + Math.cos(a) * (rx - 7), y = cy + Math.sin(a) * (ry - 7)
    const deg = (a * 180) / Math.PI
    return `<ellipse cx="${x}" cy="${y}" rx="6" ry="2.4" fill="#4b2a7a" transform="rotate(${deg} ${x} ${y})"/>`
  }).join('')
  const stellate = Array.from({ length: Math.round(rx * ry / 260) }, (_, i) => {
    const a = i * 2.4, rr = Math.sqrt(i / (rx * ry / 260)) * 0.62
    const x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr
    return `<g stroke="#b46aa6" stroke-width="1"><line x1="${x - 6}" y1="${y}" x2="${x + 6}" y2="${y}"/><line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}"/><line x1="${x - 4}" y1="${y - 4}" x2="${x + 4}" y2="${y + 4}"/></g><circle cx="${x}" cy="${y}" r="2.2" fill="#6d3a8a"/>`
  }).join('')
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fbeef4" stroke="#d48fb2" stroke-width="2"/>${stellate}${pal}`
}
files['h-ameloblastoma'] = wrap(`${stroma(1)}${island(130, 110, 85, 62)}${island(330, 90, 70, 55)}${island(270, 235, 95, 60)}${island(70, 255, 45, 38)}`, '', HE_BG)

const corrug = Array.from({ length: 25 }, (_, i) => `${i === 0 ? 'M' : 'L'} ${i * 20} ${92 + (i % 2 ? -7 : 7)}`).join(' ') + ` L ${W} 92`
const epiNuclei = Array.from({ length: 140 }, (_, i) => `<ellipse cx="${(i * 17) % W + 6}" cy="${110 + Math.floor(i / 28) * 11}" rx="3.4" ry="2.6" fill="#8a4c98"/>`).join('')
const basal = Array.from({ length: 60 }, (_, i) => `<ellipse cx="${i * 8 + 4}" cy="166" rx="2.6" ry="6" fill="#3d1f6b"/>`).join('')
files['h-okc'] = wrap(`<rect width="${W}" height="80" fill="#fff8fb"/>
<g fill="#f2a9c6" opacity=".8"><path d="M 40 30 q 30 -10 60 4 q -20 10 -60 -4 z"/><path d="M 210 46 q 30 -12 55 2 q -25 10 -55 -2 z"/><path d="M 360 22 q 25 -8 50 4 q -25 8 -50 -4 z"/></g>
<path d="${corrug} L ${W} 104 L 0 104 Z" fill="#e88ab3"/>
<rect x="0" y="100" width="${W}" height="72" fill="#f3c2d6"/>${epiNuclei}${basal}
<rect x="0" y="172" width="${W}" height="${H - 172}" fill="#f9e3ec"/>
<g transform="translate(0 172)">${stroma(3)}</g>
<ellipse cx="360" cy="250" rx="34" ry="22" fill="#f3c2d6" stroke="#e88ab3" stroke-width="5"/>`, '', HE_BG)

const saw = Array.from({ length: 13 }, (_, i) => `L ${i * 40 + 20} 190 L ${i * 40 + 40} 150`).join(' ')
const rnd = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }
const lp = Array.from({ length: 520 }, (_, i) => `<circle cx="${rnd(i, 1) * W}" cy="${196 + rnd(i, 2) * 60}" r="2.6" fill="#3d1f6b" opacity=".9"/>`).join('')
const epi2 = Array.from({ length: 170 }, (_, i) => `<ellipse cx="${(i * 23) % W}" cy="${50 + ((i * 7) % 95)}" rx="3.4" ry="2.6" fill="#9a5aa6"/>`).join('')
files['h-lichen-planus'] = wrap(`<rect width="${W}" height="40" fill="#fff8fb"/><rect y="28" width="${W}" height="14" fill="#e88ab3"/>
<path d="M 0 40 L ${W} 40 L ${W} 150 L 0 150 Z" fill="#f3c2d6"/><path d="M 0 150 ${saw} L ${W} 150" fill="#f3c2d6" stroke="#d48fb2" stroke-width="2"/>${epi2}
${lp}<g transform="translate(0 260)" opacity=".8">${stroma(5)}</g>
<circle cx="140" cy="168" r="6" fill="#e7558f"/><circle cx="300" cy="172" r="5.5" fill="#e7558f"/>`, '', HE_BG)

function pearlIsland(cx, cy, rx, ry, pearls) {
  const nuc = Array.from({ length: Math.round(rx * ry / 55) }, (_, i) => {
    const a = i * 2.39996, rr = Math.sqrt(i / (rx * ry / 55))
    return `<ellipse cx="${cx + Math.cos(a) * rx * rr * .92}" cy="${cy + Math.sin(a) * ry * rr * .92}" rx="${3 + (i % 3)}" ry="${2.4 + (i % 2)}" fill="#5a2c86"/>`
  }).join('')
  const p = pearls.map(([x, y, r]) => Array.from({ length: 4 }, (_, k) => `<circle cx="${x}" cy="${y}" r="${r - k * r / 4.5}" fill="${k % 2 ? '#f6b3cd' : '#ef8fb6'}"/>`).join('')).join('')
  return `<path d="M ${cx - rx} ${cy} Q ${cx - rx} ${cy - ry * 1.1} ${cx} ${cy - ry} Q ${cx + rx * 1.2} ${cy - ry * .9} ${cx + rx} ${cy} Q ${cx + rx * .8} ${cy + ry * 1.1} ${cx} ${cy + ry} Q ${cx - rx * 1.1} ${cy + ry * .8} ${cx - rx} ${cy} Z" fill="#f0b9cf" stroke="#c97aa3" stroke-width="2"/>${nuc}${p}`
}
files['h-scc'] = wrap(`${stroma(2)}${pearlIsland(140, 110, 90, 70, [[140, 108, 26]])}${pearlIsland(340, 200, 100, 72, [[320, 195, 24], [380, 215, 14]])}${pearlIsland(90, 255, 50, 40, [])}`, '', HE_BG)

// ---------- INSTRUMENTS ----------
const IBG = '#eef3f8'
const handle = (x, y, len = 190) => `<rect x="${x}" y="${y - 9}" width="${len}" height="18" rx="9" fill="url(#steel)"/>${Array.from({ length: Math.floor(len / 12) }, (_, i) => `<line x1="${x + 18 + i * 12}" y1="${y - 8}" x2="${x + 18 + i * 12}" y2="${y + 8}" stroke="#7d8894" stroke-width="1.4"/>`).join('')}`
files['i-who-probe'] = wrap(`${handle(30, 170)}
<path d="M 220 168 L 360 168 Q 395 168 410 140 L 430 104" stroke="url(#steelH)" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M 220 168 L 360 168 Q 395 168 410 140 L 430 104" stroke="#55606b" stroke-width="1" fill="none"/>
<circle cx="433" cy="98" r="5" fill="#9aa4ae" stroke="#55606b"/>
<line x1="418" y1="125" x2="425" y2="114" stroke="#111" stroke-width="8"/>`, '', IBG)

files['i-straight-elevator'] = wrap(`<path d="M 20 160 Q 20 120 70 122 Q 150 128 200 150 L 200 170 Q 150 192 70 198 Q 20 200 20 160 Z" fill="url(#steel)" stroke="#6b7682"/>
<rect x="198" y="153" width="170" height="14" fill="url(#steel)"/>
<path d="M 366 150 L 440 154 Q 452 160 440 166 L 366 170 Z" fill="url(#steel)" stroke="#6b7682"/>
<path d="M 372 156 Q 410 160 444 160" stroke="#55606b" stroke-width="2" fill="none"/>`, '', IBG)

files['i-cryer'] = wrap(`${handle(20, 180, 210)}
<rect x="226" y="175" width="150" height="10" fill="url(#steelH)"/>
<path d="M 376 176 L 376 184 L 384 184 L 384 120 Z" fill="#9aa4ae"/>
<path d="M 376 180 L 430 120 L 382 132 Z" fill="url(#steel)" stroke="#55606b" stroke-width="1.5"/>`, '', IBG)

files['i-amalgam-carrier'] = wrap(`${handle(40, 170, 220)}
<path d="M 255 162 L 360 140 L 362 152 L 257 178 Z" fill="url(#steelH)" stroke="#6b7682"/>
<rect x="356" y="128" width="62" height="26" rx="6" fill="url(#steel)" stroke="#55606b" transform="rotate(-12 356 140)"/>
<ellipse cx="420" cy="128" rx="6" ry="13" fill="#3a434d" transform="rotate(-12 420 128)"/>
<path d="M 120 158 L 250 130 L 256 138 L 130 168 Z" fill="#c9d1d9" stroke="#6b7682"/>`, '', IBG)

// ---------- SPECIMEN ----------
const denticles = [[150, 140, -20], [200, 120, 10], [250, 150, 35], [190, 190, -40], [260, 205, 5], [310, 165, -15], [320, 220, 60], [140, 210, 25], [230, 250, -10]]
  .map(([x, y, r], i) => {
    const s = 0.7 + (i % 3) * 0.15
    return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M -12 -18 Q 0 -26 12 -18 Q 15 -2 9 6 L 5 32 Q 0 38 -5 32 L -9 6 Q -15 -2 -12 -18 Z" fill="#f4efe1" stroke="#b9ad8f" stroke-width="2"/><path d="M -12 -18 Q 0 -26 12 -18 Q 13 -8 11 -4 Q 0 -8 -11 -4 Q -13 -8 -12 -18 Z" fill="#fffdf6"/></g>`
  }).join('')
files['s-compound-odontome'] = wrap(`<rect x="40" y="40" width="400" height="240" rx="16" fill="#1f3a4d"/><rect x="52" y="52" width="376" height="216" rx="12" fill="#264a61"/>
${denticles}
<g stroke="#e5e7eb" stroke-width="2"><line x1="70" y1="250" x2="170" y2="250"/><line x1="70" y1="245" x2="70" y2="255"/><line x1="170" y1="245" x2="170" y2="255"/></g>
<text x="120" y="268" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#e5e7eb">1 cm</text>`, '', '#16293a')

for (const [name, svg] of Object.entries(files)) writeFileSync(new URL(`${name}.svg`, OUT), svg)
console.log('wrote', Object.keys(files).length, 'spotter SVGs')
