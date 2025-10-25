const { orderCorners, scoreSquareCandidate, selectRegistrationCorners } = (function(){
  // Load from browser global when jest runs via jsdom environment
  if (typeof window !== 'undefined' && window.cvGeometry) return window.cvGeometry;
  // Fallback import by evaluating the file in Node (simple require won't work without exports)
  const fs = require('fs');
  const vm = require('vm');
  const code = fs.readFileSync('public/cv/geometry.js','utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.cvGeometry;
})();

test('orderCorners returns 4 points', () => {
  const pts = [{x:100,y:100},{x:200,y:100},{x:200,y:200},{x:100,y:200}];
  const ordered = orderCorners(pts);
  expect(ordered).toHaveLength(4);
});

test('selectRegistrationCorners chooses the only candidate', () => {
  const imgW=400, imgH=300;
  const candidate = [{x:100,y:80},{x:260,y:85},{x:255,y:220},{x:95,y:215}];
  const chosen = selectRegistrationCorners([candidate], imgW, imgH);
  expect(chosen).not.toBeNull();
});

