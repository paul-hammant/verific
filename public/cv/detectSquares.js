// OpenCV-based detection and crop/warp
// Exposes window.detectSquaresFromCanvas(canvas, opts)

(function(){
  async function ensureCvReady() {
    if (window.cv && cv.Mat) return;
    await (window.cvReady || Promise.reject(new Error('OpenCV not loaded')));
    if (!(window.cv && cv.Mat)) throw new Error('OpenCV failed to initialize');
  }

  function matFromCanvas(canvas) {
    const src = cv.imread(canvas);
    return src;
  }

  function findSquareCandidates(src, opts={}) {
    const { minAreaRatio=0.0005, maxAreaRatio=0.5, approxEpsilon=0.02, thresh=0 } = opts;
    const imgW = src.cols, imgH = src.rows;
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    const blur = new cv.Mat();
    cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0);
    const bw = new cv.Mat();
    if (thresh>0) {
      cv.threshold(blur, bw, thresh, 255, cv.THRESH_BINARY);
    } else {
      cv.adaptiveThreshold(blur, bw, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
    }
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(bw, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    const candidates = [];
    for (let i=0;i<contours.size();i++) {
      const c = contours.get(i);
      const peri = cv.arcLength(c, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(c, approx, approxEpsilon*peri, true);
      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const area = cv.contourArea(approx);
        const areaRatio = area/(imgW*imgH);
        if (areaRatio>minAreaRatio && areaRatio<maxAreaRatio) {
          const pts = [];
          for (let j=0;j<4;j++) {
            const x = approx.intPtr(j,0)[0];
            const y = approx.intPtr(j,0)[1];
            pts.push({x,y});
          }
          candidates.push(pts);
        }
      }
      approx.delete(); c.delete();
    }
    gray.delete(); blur.delete(); bw.delete(); contours.delete(); hierarchy.delete();
    return candidates;
  }

  function warpToTightRect(src, corners, outSize= null) {
    const [tl,tr,br,bl] = window.cvGeometry.orderCorners(corners);
    const widthA = Math.hypot(br.x-bl.x, br.y-bl.y);
    const widthB = Math.hypot(tr.x-tl.x, tr.y-tl.y);
    const maxW = Math.round(Math.max(widthA,widthB));
    const heightA = Math.hypot(tr.x-br.x, tr.y-br.y);
    const heightB = Math.hypot(tl.x-bl.x, tl.y-bl.y);
    const maxH = Math.round(Math.max(heightA,heightB));
    const dstW = outSize?.width || maxW;
    const dstH = outSize?.height || maxH;
    const srcTri = cv.matFromArray(4,1,cv.CV_32FC2, [tl.x,tl.y, tr.x,tr.y, br.x,br.y, bl.x,bl.y]);
    const dstTri = cv.matFromArray(4,1,cv.CV_32FC2, [0,0, dstW,0, dstW,dstH, 0,dstH]);
    const M = cv.getPerspectiveTransform(srcTri, dstTri);
    const dst = new cv.Mat();
    cv.warpPerspective(src, dst, M, new cv.Size(dstW,dstH));
    srcTri.delete(); dstTri.delete(); M.delete();
    return dst;
  }

  async function detectSquaresFromCanvas(canvas, opts={}) {
    await ensureCvReady();
    const src = matFromCanvas(canvas);
    try {
      const candidates = findSquareCandidates(src, opts);
      const best = window.cvGeometry.selectRegistrationCorners(candidates, src.cols, src.rows);
      if (!best) {
        return { ok:false, error:'No registration square detected', candidates };
      }
      const warped = warpToTightRect(src, best);
      // Convert to canvas
      const outCanvas = document.createElement('canvas');
      cv.imshow(outCanvas, warped);
      warped.delete();
      return { ok:true, corners: best, croppedCanvas: outCanvas, candidates };
    } finally {
      src.delete();
    }
  }

  window.detectSquaresFromCanvas = detectSquaresFromCanvas;
})();

