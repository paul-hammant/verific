// Pure geometry helpers used by detector and tests

function orderCorners(corners) {
  // corners: [{x,y} x4] — return in TL, TR, BR, BL order
  const pts = corners.slice();
  // Compute centroid
  const cx = pts.reduce((s,p)=>s+p.x,0)/pts.length;
  const cy = pts.reduce((s,p)=>s+p.y,0)/pts.length;
  // Angle from centroid
  pts.sort((a,b)=>Math.atan2(a.y-cy,a.x-cx)-Math.atan2(b.y-cy,b.x-cx));
  // After sort CCW starting near -pi; rotate so first is top-left (min x+y)
  const idx = pts.reduce((best,i,cur)=>{
    const val = i.x + i.y; const bestVal = pts[best].x + pts[best].y; return val<bestVal?cur:best;},0);
  const ordered = pts.slice(idx).concat(pts.slice(0,idx));
  // Ensure order TL, TR, BR, BL (clockwise)
  return ordered;
}

function scoreSquareCandidate(candidate, imgW, imgH) {
  // Simple heuristic: area close to square of min(imgW,imgH)*0.2, near center
  const [tl,tr,br,bl] = orderCorners(candidate);
  const w1 = Math.hypot(tr.x-tl.x, tr.y-tl.y);
  const w2 = Math.hypot(br.x-bl.x, br.y-bl.y);
  const h1 = Math.hypot(bl.x-tl.x, bl.y-tl.y);
  const h2 = Math.hypot(br.x-tr.x, br.y-tr.y);
  const w = (w1+w2)/2, h=(h1+h2)/2;
  const area = w*h;
  const ideal = Math.pow(Math.min(imgW,imgH)*0.25,2);
  const areaScore = Math.exp(-Math.abs(area-ideal)/ideal);
  const cx = (tl.x+tr.x+br.x+bl.x)/4, cy=(tl.y+tr.y+br.y+bl.y)/4;
  const dx = (cx-imgW/2)/(imgW/2), dy=(cy-imgH/2)/(imgH/2);
  const centerScore = Math.exp(-(dx*dx+dy*dy));
  const ratio = w/h; const ratioScore = Math.exp(-Math.abs(ratio-1));
  return areaScore*centerScore*ratioScore;
}

function selectRegistrationCorners(candidates, imgW, imgH) {
  if (!candidates || candidates.length===0) return null;
  let best = null, bestScore = -1;
  for (const c of candidates) {
    if (c.length!==4) continue;
    const s = scoreSquareCandidate(c, imgW, imgH);
    if (s>bestScore) { bestScore=s; best=c; }
  }
  return best ? orderCorners(best) : null;
}

window.cvGeometry = { orderCorners, scoreSquareCandidate, selectRegistrationCorners };

