import { PROJECTS_DATA } from '../src/data/projects.ts';
import { isMcuPin, getMcuPinCoord, getComponentTargetCoord } from '../src/renderer/wire-engine.ts';

for (const p of PROJECTS_DATA) {
  const isArduino = p.board.toLowerCase().includes('arduino');
  const issues: any[] = [];
  p.wiringTable.forEach((w, i) => {
    const startIsMcu = isMcuPin(w.from);
    const startPt = startIsMcu 
      ? getMcuPinCoord(w.from, 'real', isArduino, p.id)
      : getComponentTargetCoord({ ...w, to: w.from }, i, p.wiringTable.length, p, 'oled', 'real');
      
    const endIsMcu = isMcuPin(w.to);
    const endPt = endIsMcu
      ? getMcuPinCoord(w.to, 'real', isArduino, p.id)
      : getComponentTargetCoord(w, i, p.wiringTable.length, p, 'oled', 'real');
    
    if (startPt.x === 580 || endPt.x === 580) {
      issues.push({ wire: i, from: w.from, to: w.to, start: startPt, end: endPt });
    }
  });
  if (issues.length > 0) {
    console.log(`PROJECT: ${p.id} (${issues.length} fallback wires):`);
    issues.forEach(iss => console.log(`   [${iss.from}] (${iss.start.x},${iss.start.y}) --> [${iss.to}] (${iss.end.x},${iss.end.y})`));
  } else {
    console.log(`PROJECT: ${p.id} OK`);
  }
}
