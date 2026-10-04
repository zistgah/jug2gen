/**
 * Mesh generation and exchange for CAD, CNC, laser, and 3D-print tools.
 * Geometry is a parametric link: flange, pivot, beam, pad. Illustrative, not a certified part.
 */

export function buildLinkMesh(state) {
  const Lmm = clamp(state.L * 1000, 40, 4000);
  const mass = Math.max(state.m, 0.05);
  const section = clamp(8 + Math.cbrt(mass) * 6.5, 8, 80);
  const flangeR = clamp(section * 1.7, 18, 120);
  const parts = [];

  parts.push(box("flange", flangeR * 2.2, flangeR * 2.2, 8, 0, 0, 4));
  parts.push(cylinder("boss", flangeR * 0.55, 16, 0, 0, 14, 18));
  parts.push(cylinder("pivot", section * 0.28, section * 1.3, 0, 0, 22, 16));
  parts.push(box("beam", section, section * 0.72, Lmm, 0, 0, 28 + Lmm / 2));
  parts.push(box("pad", section * 1.8, section * 1.15, 10, 0, 0, 28 + Lmm + 5));
  parts.push(cylinder("motor", section * 0.9, section * 1.6, -section * 1.5, 0, 20, 20));

  const mesh = merge(parts);
  mesh.meta = {
    units: "mm",
    length: Lmm,
    section,
    flangeR,
    massKg: state.m,
    name: "j2g-link",
  };
  return mesh;
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function box(name, w, d, h, x, y, z) {
  const x0 = x - w / 2, x1 = x + w / 2;
  const y0 = y - d / 2, y1 = y + d / 2;
  const z0 = z - h / 2, z1 = z + h / 2;
  const v = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ];
  const faces = [
    [0, 1, 2], [0, 2, 3],
    [4, 6, 5], [4, 7, 6],
    [0, 4, 5], [0, 5, 1],
    [1, 5, 6], [1, 6, 2],
    [2, 6, 7], [2, 7, 3],
    [3, 7, 4], [3, 4, 0],
  ];
  return { name, v, faces };
}

function cylinder(name, r, h, x, y, z, n = 16) {
  const v = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    v.push([x + Math.cos(a) * r, y + Math.sin(a) * r, z - h / 2]);
  }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    v.push([x + Math.cos(a) * r, y + Math.sin(a) * r, z + h / 2]);
  }
  v.push([x, y, z - h / 2]);
  v.push([x, y, z + h / 2]);
  const bottom = v.length - 2;
  const top = v.length - 1;
  const faces = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faces.push([i, j, n + j]);
    faces.push([i, n + j, n + i]);
    faces.push([bottom, j, i]);
    faces.push([top, n + i, n + j]);
  }
  return { name, v, faces };
}

function merge(parts) {
  const positions = [];
  const normals = [];
  const indices = [];
  let offset = 0;
  for (const p of parts) {
    for (const face of p.faces) {
      const tri = face.map((i) => p.v[i]);
      const n = normal(tri[0], tri[1], tri[2]);
      for (const vtx of tri) {
        positions.push(vtx[0], vtx[1], vtx[2]);
        normals.push(n[0], n[1], n[2]);
      }
      indices.push(offset, offset + 1, offset + 2);
      offset += 3;
    }
  }
  return { positions, normals, indices, count: indices.length / 3 };
}

function normal(a, b, c) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let x = uy * vz - uz * vy;
  let y = uz * vx - ux * vz;
  let z = ux * vy - uy * vx;
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

export function stlAscii(mesh) {
  let s = `solid ${mesh.meta.name}\n`;
  for (let i = 0; i < mesh.count; i++) {
    const n = i * 9;
    const nn = i * 9;
    s += `  facet normal ${mesh.normals[nn]} ${mesh.normals[nn + 1]} ${mesh.normals[nn + 2]}\n    outer loop\n`;
    for (let k = 0; k < 3; k++) {
      const o = n + k * 3;
      s += `      vertex ${mesh.positions[o]} ${mesh.positions[o + 1]} ${mesh.positions[o + 2]}\n`;
    }
    s += "    endloop\n  endfacet\n";
  }
  s += `endsolid ${mesh.meta.name}\n`;
  return s;
}

export function stlBinary(mesh) {
  const buf = new ArrayBuffer(84 + mesh.count * 50);
  const view = new DataView(buf);
  const header = "Jugaad-to-Genesis parametric link, millimetres";
  for (let i = 0; i < 80; i++) view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
  view.setUint32(80, mesh.count, true);
  let p = 84;
  for (let i = 0; i < mesh.count; i++) {
    view.setFloat32(p, mesh.normals[i * 9], true);
    view.setFloat32(p + 4, mesh.normals[i * 9 + 1], true);
    view.setFloat32(p + 8, mesh.normals[i * 9 + 2], true);
    for (let k = 0; k < 9; k++) view.setFloat32(p + 12 + k * 4, mesh.positions[i * 9 + k], true);
    view.setUint16(p + 48, 0, true);
    p += 50;
  }
  return buf;
}

export function objText(mesh) {
  let s = "# Jugaad-to-Genesis parametric link\n# units: millimetres\n";
  for (let i = 0; i < mesh.positions.length; i += 3) {
    s += `v ${mesh.positions[i]} ${mesh.positions[i + 1]} ${mesh.positions[i + 2]}\n`;
  }
  for (let i = 0; i < mesh.normals.length; i += 3) {
    s += `vn ${mesh.normals[i]} ${mesh.normals[i + 1]} ${mesh.normals[i + 2]}\n`;
  }
  for (let i = 0; i < mesh.count; i++) {
    const a = i * 3 + 1;
    s += `f ${a}//${a} ${a + 1}//${a + 1} ${a + 2}//${a + 2}\n`;
  }
  return s;
}

export function scadText(state, mesh) {
  const m = mesh.meta;
  return `// Jugaad-to-Genesis parametric link
// Illustrative fabrication solid — not a certified drawing.
// Open in OpenSCAD. Units: millimetres.

L = ${m.length.toFixed(2)};
section = ${m.section.toFixed(2)};
flange_r = ${m.flangeR.toFixed(2)};
mass_kg = ${Number(state.m).toFixed(3)};

module j2g_link() {
  color([0.72, 0.58, 0.40])
    cube([flange_r * 2.2, flange_r * 2.2, 8], center = true);
  translate([0, 0, 10])
    cylinder(h = 16, r = flange_r * 0.55, center = true, $fn = 48);
  translate([0, 0, 22])
    rotate([90, 0, 0])
      cylinder(h = section * 1.3, r = section * 0.28, center = true, $fn = 32);
  translate([0, 0, 28 + L / 2])
    cube([section, section * 0.72, L], center = true);
  translate([0, 0, 28 + L + 5])
    cube([section * 1.8, section * 1.15, 10], center = true);
  translate([-section * 1.5, 0, 20])
    color([0.55, 0.32, 0.18])
      cylinder(h = section * 1.6, r = section * 0.9, center = true, $fn = 48);
}

j2g_link();
`;
}

export function dxfText(mesh) {
  const m = mesh.meta;
  const s = m.section;
  const L = m.length;
  const fr = m.flangeR;
  const lines = [
    [0, 0, fr * 2.2, 0],
    [fr * 2.2, 0, fr * 2.2, fr * 2.2],
    [fr * 2.2, fr * 2.2, 0, fr * 2.2],
    [0, fr * 2.2, 0, 0],
    [fr * 1.1 - s / 2, fr * 1.1, fr * 1.1 - s / 2, fr * 1.1 + L],
    [fr * 1.1 + s / 2, fr * 1.1, fr * 1.1 + s / 2, fr * 1.1 + L],
    [fr * 1.1 - s / 2, fr * 1.1 + L, fr * 1.1 + s / 2, fr * 1.1 + L],
  ];
  let body = "0\nSECTION\n2\nENTITIES\n";
  for (const [x1, y1, x2, y2] of lines) {
    body += `0\nLINE\n8\nJ2G\n10\n${x1.toFixed(3)}\n20\n${y1.toFixed(3)}\n30\n0\n11\n${x2.toFixed(3)}\n21\n${y2.toFixed(3)}\n31\n0\n`;
  }
  body += `0\nCIRCLE\n8\nJ2G\n10\n${(fr * 1.1).toFixed(3)}\n20\n${(fr * 1.1).toFixed(3)}\n30\n0\n40\n${(fr * 0.45).toFixed(3)}\n`;
  body += "0\nENDSEC\n0\nEOF\n";
  return "0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n" + body;
}

export function svgText(mesh) {
  const m = mesh.meta;
  const w = m.flangeR * 2.4 + 40;
  const h = m.length + m.flangeR * 2 + 80;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(1)}mm" height="${h.toFixed(1)}mm" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}">
  <title>J2G link profile</title>
  <rect x="${(w / 2 - m.flangeR * 1.1).toFixed(2)}" y="12" width="${(m.flangeR * 2.2).toFixed(2)}" height="${(m.flangeR * 2.2).toFixed(2)}" fill="none" stroke="#1a1a1a" stroke-width="0.4"/>
  <circle cx="${(w / 2).toFixed(2)}" cy="${(12 + m.flangeR * 1.1).toFixed(2)}" r="${(m.flangeR * 0.45).toFixed(2)}" fill="none" stroke="#1a1a1a" stroke-width="0.4"/>
  <rect x="${(w / 2 - m.section / 2).toFixed(2)}" y="${(16 + m.flangeR * 2.2).toFixed(2)}" width="${m.section.toFixed(2)}" height="${m.length.toFixed(2)}" fill="none" stroke="#1a1a1a" stroke-width="0.4"/>
  <text x="6" y="${(h - 8).toFixed(1)}" font-size="4" font-family="monospace">J2G profile · mm · L=${m.length.toFixed(0)} · illustrative</text>
</svg>
`;
}

export function gcodeText(mesh) {
  const m = mesh.meta;
  const fr = m.flangeR;
  const size = fr * 2.2;
  const zCut = -3;
  const feed = 180;
  const plunge = 60;
  let g = [];
  g.push("(Jugaad-to-Genesis flange contour)");
  g.push("(Illustrative GRBL 2.5D path — verify offsets, stock, and tool before cutting)");
  g.push("(Units mm, absolute, tool assumed 3 mm endmill, conventional)");
  g.push("G21");
  g.push("G90");
  g.push("G17");
  g.push("G94");
  g.push("G0 Z5.000");
  g.push("M3 S12000");
  g.push(`G0 X0 Y0`);
  g.push("G1 Z0.000 F" + plunge);
  g.push(`G1 Z${zCut.toFixed(3)} F${plunge}`);
  const path = [
    [0, 0],
    [size, 0],
    [size, size],
    [0, size],
    [0, 0],
  ];
  for (const [x, y] of path) g.push(`G1 X${x.toFixed(3)} Y${y.toFixed(3)} F${feed}`);
  g.push(`G0 Z5.000`);
  g.push(`G0 X${(size / 2).toFixed(3)} Y${(size / 2).toFixed(3)}`);
  g.push(`G1 Z${zCut.toFixed(3)} F${plunge}`);
  g.push(`G1 X${(size / 2 + fr * 0.35).toFixed(3)} Y${(size / 2).toFixed(3)} F${feed}`);
  g.push("G0 Z5.000");
  g.push("M5");
  g.push("M30");
  return g.join("\n") + "\n";
}

/** Minimal AP214 STEP of the beam box and flange box. Opens in FreeCAD as nominal solids. */
export function stepText(mesh) {
  const m = mesh.meta;
  const s = m.section;
  const L = m.length;
  const fr = m.flangeR * 1.1;
  return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Jugaad-to-Genesis illustrative link'),'2;1');
FILE_NAME('j2g-link.step','2026-10-04',('Jugaad-to-Genesis'),(''),'J2G exchange','','');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));
ENDSEC;
DATA;
#1 = CARTESIAN_POINT('',(0.,0.,0.));
#2 = DIRECTION('',(0.,0.,1.));
#3 = DIRECTION('',(1.,0.,0.));
#4 = AXIS2_PLACEMENT_3D('',#1,#2,#3);
#5 = CARTESIAN_POINT('',(0.,0.,${(4).toFixed(3)}));
#6 = AXIS2_PLACEMENT_3D('',#5,#2,#3);
#7 = BLOCK('FLANGE',#6,${(fr * 2).toFixed(3)},${(fr * 2).toFixed(3)},8.);
#8 = CARTESIAN_POINT('',(${(-s / 2).toFixed(3)},${(-s * 0.36).toFixed(3)},28.));
#9 = AXIS2_PLACEMENT_3D('',#8,#2,#3);
#10 = BLOCK('BEAM',#9,${s.toFixed(3)},${(s * 0.72).toFixed(3)},${L.toFixed(3)});
#11 = MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION('',(#4),#12);
#12 = ( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#13)) GLOBAL_UNIT_ASSIGNED_CONTEXT((#14,#15,#16)) REPRESENTATION_CONTEXT('Context','3D') );
#13 = UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(0.01),#14,'distance_accuracy_value','confusion accuracy');
#14 = ( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) );
#15 = ( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) );
#16 = ( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() );
#17 = ADVANCED_BREP_SHAPE_REPRESENTATION('NONE',(#7,#10),#12);
ENDSEC;
END-ISO-10303-21;
`;
}

export function threeMf(mesh) {
  const verts = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    verts.push(`<vertex x="${mesh.positions[i]}" y="${mesh.positions[i + 1]}" z="${mesh.positions[i + 2]}"/>`);
  }
  const tris = [];
  for (let i = 0; i < mesh.count; i++) {
    tris.push(`<triangle v1="${i * 3}" v2="${i * 3 + 1}" v3="${i * 3 + 2}"/>`);
  }
  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">J2G link</metadata>
  <metadata name="Application">Jugaad-to-Genesis</metadata>
  <resources>
    <object id="1" type="model" name="j2g-link">
      <mesh>
        <vertices>${verts.join("")}</vertices>
        <triangles>${tris.join("")}</triangles>
      </mesh>
    </object>
  </resources>
  <build><item objectid="1"/></build>
</model>`;
  const types = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
  return zipStore([
    { name: "[Content_Types].xml", data: types },
    { name: "_rels/.rels", data: rels },
    { name: "3D/3dmodel.model", data: model },
  ]);
}

function zipStore(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = enc.encode(f.data);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const v = new DataView(local.buffer);
    v.setUint32(0, 0x04034b50, true);
    v.setUint16(4, 20, true);
    v.setUint16(8, 0, true);
    v.setUint16(10, 0, true);
    v.setUint32(14, crc, true);
    v.setUint32(18, data.length, true);
    v.setUint32(22, data.length, true);
    v.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    parts.push(local);
    const c = new Uint8Array(46 + name.length);
    const cv = new DataView(c.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    c.set(name, 46);
    central.push(c);
    offset += local.length;
  }
  const centralBlob = concat(central);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralBlob.length, true);
  ev.setUint32(16, offset, true);
  return concat([...parts, centralBlob, end]);
}

function concat(chunks) {
  const len = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

function crc32(bytes) {
  let c = ~0;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

export function parseSTL(buffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 84) throw new Error("STL too small");
  const count = view.getUint32(80, true);
  const expect = 84 + count * 50;
  if (expect === buffer.byteLength && count > 0 && count < 5_000_000) {
    const positions = new Float32Array(count * 9);
    let p = 84;
    for (let i = 0; i < count; i++) {
      p += 12;
      for (let k = 0; k < 9; k++) {
        positions[i * 9 + k] = view.getFloat32(p, true);
        p += 4;
      }
      p += 2;
    }
    return { positions, count, binary: true };
  }
  const text = new TextDecoder().decode(buffer);
  if (!/facet/i.test(text)) throw new Error("Unrecognised STL");
  const positions = [];
  const re = /vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/gi;
  let m;
  while ((m = re.exec(text))) positions.push(Number(m[1]), Number(m[2]), Number(m[3]));
  return { positions: Float32Array.from(positions), count: positions.length / 9, binary: false };
}

export function parseOBJ(text) {
  const verts = [];
  const positions = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith("v ")) {
      const p = t.split(/\s+/);
      verts.push([Number(p[1]), Number(p[2]), Number(p[3])]);
    } else if (t.startsWith("f ")) {
      const idx = t
        .split(/\s+/)
        .slice(1)
        .map((tok) => parseInt(tok.split("/")[0], 10) - 1);
      if (idx.length >= 3) {
        for (let i = 1; i < idx.length - 1; i++) {
          for (const k of [idx[0], idx[i], idx[i + 1]]) {
            const v = verts[k];
            if (v) positions.push(v[0], v[1], v[2]);
          }
        }
      }
    }
  }
  if (!positions.length) throw new Error("OBJ has no faces");
  return { positions: Float32Array.from(positions), count: positions.length / 9 };
}

export function specJSON(state, analysis) {
  return JSON.stringify(
    {
      format: "j2g-node",
      version: 1,
      classification: "Cat 4/6 illustrative parameter set",
      state,
      analysis,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

export const FORMAT_GUIDE = [
  { ext: "STL", tools: "Cura, PrusaSlicer, Bambu, Meshmixer, Fusion, FreeCAD", use: "Mesh print / reference" },
  { ext: "3MF", tools: "Cura, PrusaSlicer, Bambu Studio, OrcaSlicer", use: "3D-print package" },
  { ext: "OBJ", tools: "Blender, MeshLab, Fusion", use: "Mesh interchange" },
  { ext: "SCAD", tools: "OpenSCAD, FreeCAD OpenSCAD workbench", use: "Parametric solid" },
  { ext: "DXF", tools: "LibreCAD, Fusion, Estlcam, LightBurn", use: "2D CNC / laser profile" },
  { ext: "SVG", tools: "Inkscape, LightBurn, xTool", use: "Laser / plot" },
  { ext: "G-code", tools: "GRBL, LinuxCNC, UGS", use: "Illustrative 2.5D contour" },
  { ext: "STEP", tools: "FreeCAD, CAD kernels", use: "Nominal blocks, best effort" },
  { ext: "JSON", tools: "This laboratory, scripts", use: "Node state round-trip" },
  { ext: "CSV", tools: "Spreadsheets, CAM notes", use: "BOM and parameters" },
];
