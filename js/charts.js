/** Publication-style canvas charts. Device pixel ratio aware. */

export function mountChart(canvas, draw) {
  const ctx = canvas.getContext("2d");
  const paint = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, rect.width);
    const h = Math.max(180, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, w, h);
  };
  paint();
  return paint;
}

export function drawCost(ctx, w, h, pts, marker) {
  const pad = { l: 58, r: 18, t: 28, b: 36 };
  clear(ctx, w, h);
  const xs = pts.map((p) => Math.log(p.m));
  const ys = pts.map((p) => p.c);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y1 = Math.max(...ys) * 1.05;
  const y0 = 0;
  const X = (m) => pad.l + ((Math.log(m) - x0) / (x1 - x0)) * (w - pad.l - pad.r);
  const Y = (c) => pad.t + (1 - (c - y0) / (y1 - y0)) * (h - pad.t - pad.b);

  bands(ctx, X, pad, h, [
    [0.25, 1.2, "rgba(224,122,95,0.14)"],
    [10, 150, "rgba(125,206,160,0.10)"],
    [150, 600, "rgba(138,164,200,0.12)"],
  ]);

  grid(ctx, w, h, pad, [0.5, 1.2, 10, 50, 150, 500], (m) => X(m), yTicks(y1), (c) => Y(c));
  axisLabels(ctx, w, h, pad, "Mass (kg, log)", "₹ / kg");

  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = X(p.m);
    const y = Y(p.c);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#e4c99a";
  ctx.lineWidth = 2.2;
  ctx.stroke();

  kink(ctx, X(1.2), pad, h, "1.2 kg", "Precision");
  kink(ctx, X(150), pad, h, "150 kg", "Crane");
  if (marker) {
    const x = X(marker.m);
    const y = Y(marker.c);
    ctx.fillStyle = "#f0b429";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a140c";
    ctx.lineWidth = 2;
    ctx.stroke();
    label(ctx, x + 8, y - 10, `${marker.m.toFixed(1)} kg`);
  }
  title(ctx, "Specific cost  ·  illustrative");
}

export function drawTorque(ctx, w, h, series) {
  const pad = { l: 58, r: 16, t: 28, b: 36 };
  clear(ctx, w, h);
  const max = Math.max(...series.flatMap((s) => s.pts.map((p) => p.y)), 1);
  const X = (i, n) => pad.l + (i / (n - 1)) * (w - pad.l - pad.r);
  const Y = (v) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  grid(ctx, w, h, pad, [], () => 0, yTicks(max), Y);
  axisLabels(ctx, w, h, pad, "Angle  −20° → 70°", "Torque (N·m)");
  for (const s of series) {
    ctx.beginPath();
    s.pts.forEach((p, i) => {
      const x = X(i, s.pts.length);
      const y = Y(p.y);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  legend(ctx, w, series);
  title(ctx, "Joint torque vs angle");
}

export function drawScale(ctx, w, h, rows) {
  const pad = { l: 64, r: 16, t: 28, b: 28 };
  clear(ctx, w, h);
  const max = Math.max(...rows.map((r) => r.tau), 1);
  const gap = (h - pad.t - pad.b) / rows.length;
  rows.forEach((r, i) => {
    const y = pad.t + i * gap + 6;
    const bw = ((w - pad.l - pad.r) * r.tau) / max;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(pad.l, y, w - pad.l - pad.r, gap - 10);
    ctx.fillStyle = r.color;
    ctx.fillRect(pad.l, y, Math.max(bw, 2), gap - 10);
    ctx.fillStyle = "#cfc6b8";
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.textAlign = "right";
    ctx.fillText(r.label, pad.l - 8, y + 14);
    ctx.textAlign = "left";
    ctx.fillStyle = "#1a140c";
    if (bw > 70) ctx.fillText(`${Math.round(r.tau)} N·m`, pad.l + 8, y + 14);
  });
  title(ctx, "Required peak torque by regime");
}

export function drawRadar(ctx, w, h, axes, series) {
  clear(ctx, w, h);
  const cx = w / 2;
  const cy = h / 2 + 6;
  const r = Math.min(w, h) * 0.34;
  const n = axes.length;
  ctx.strokeStyle = "rgba(232,220,196,0.16)";
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const rr = (r * ring) / 4;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  for (const s of series) {
    ctx.beginPath();
    s.scores.forEach((sc, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const rr = r * (sc / 100);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = s.fill;
    ctx.strokeStyle = s.stroke;
    ctx.lineWidth = 1.6;
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#d9d0c3";
  ctx.font = "11px IBM Plex Mono, monospace";
  ctx.textAlign = "center";
  axes.forEach((name, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * (r + 16);
    const y = cy + Math.sin(a) * (r + 16);
    ctx.fillText(name, x, y);
  });
  title(ctx, "Capability field");
}

function clear(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#10141b";
  ctx.fillRect(0, 0, w, h);
}

function title(ctx, text) {
  ctx.fillStyle = "#9a9286";
  ctx.font = "11px IBM Plex Mono, monospace";
  ctx.textAlign = "left";
  ctx.fillText(text.toUpperCase(), 12, 16);
}

function bands(ctx, X, pad, h, list) {
  for (const [a, b, color] of list) {
    const x1 = X(a);
    const x2 = X(b);
    ctx.fillStyle = color;
    ctx.fillRect(x1, pad.t, x2 - x1, h - pad.t - pad.b);
  }
}

function grid(ctx, w, h, pad, xticks, X, yticks, Y) {
  ctx.strokeStyle = "rgba(232,220,196,0.08)";
  ctx.fillStyle = "#8a8478";
  ctx.font = "10px IBM Plex Mono, monospace";
  ctx.lineWidth = 1;
  for (const m of xticks) {
    const x = X(m);
    ctx.beginPath();
    ctx.moveTo(x, pad.t);
    ctx.lineTo(x, h - pad.b);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillText(String(m), x, h - pad.b + 16);
  }
  for (const c of yticks) {
    const y = Y(c);
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText(c >= 1000 ? `${Math.round(c / 1000)}k` : String(Math.round(c)), pad.l - 8, y + 3);
  }
}

function yTicks(max) {
  const step = nice(max / 4);
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  return ticks;
}

function nice(x) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(x, 1e-6))));
  const n = x / p;
  const f = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
  return f * p;
}

function axisLabels(ctx, w, h, pad, xLabel, yLabel) {
  ctx.fillStyle = "#8a8478";
  ctx.font = "11px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, pad.l + (w - pad.l - pad.r) / 2, h - 6);
  ctx.save();
  ctx.translate(14, pad.t + (h - pad.t - pad.b) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

function kink(ctx, x, pad, h, a, b) {
  ctx.strokeStyle = "rgba(240,180,41,0.45)";
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(x, pad.t);
  ctx.lineTo(x, h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, x + 4, pad.t + 12, a);
  label(ctx, x + 4, pad.t + 24, b);
}

function label(ctx, x, y, text) {
  ctx.fillStyle = "#e8e4dc";
  ctx.font = "10px IBM Plex Mono, monospace";
  ctx.textAlign = "left";
  ctx.fillText(text, x, y);
}

function legend(ctx, w, series) {
  let x = w - 16;
  ctx.textAlign = "right";
  ctx.font = "11px IBM Plex Mono, monospace";
  series.forEach((s, i) => {
    const y = 18 + i * 14;
    ctx.fillStyle = s.color;
    ctx.fillRect(x - 118, y - 8, 10, 3);
    ctx.fillStyle = "#d9d0c3";
    ctx.fillText(s.name, x, y);
  });
}
