const planetRadius = 350;
const ORBIT_LABELS = [
  {
    id: 'editorial-design',
    text: 'Editorial Design',
    radiusMultiplier: 1.52,
    period: 32,
    initialPhase: 0.2,
    tiltX: (62 * Math.PI) / 180,
    tiltZ: (-20 * Math.PI) / 180,
    direction: 1,
  },
  {
    id: 'social-media',
    text: 'Social Media',
    radiusMultiplier: 1.32,
    period: 24,
    initialPhase: Math.PI * 0.5 + 0.3,
    tiltX: (68 * Math.PI) / 180,
    tiltZ: (22 * Math.PI) / 180,
    direction: 1,
  },
  {
    id: 'branding',
    text: 'Branding',
    radiusMultiplier: 1.44,
    period: 28,
    initialPhase: Math.PI - 0.2,
    tiltX: (-60 * Math.PI) / 180,
    tiltZ: (-16 * Math.PI) / 180,
    direction: -1,
  },
  {
    id: 'event-graphics',
    text: 'Event Graphics',
    radiusMultiplier: 1.36,
    period: 36,
    initialPhase: Math.PI * 1.5 + 0.2,
    tiltX: (-65 * Math.PI) / 180,
    tiltZ: (18 * Math.PI) / 180,
    direction: 1,
  },
];

function project(orbit, time) {
  const orbitRadius = orbit.radiusMultiplier * planetRadius;
  const angularSpeed = ((2 * Math.PI) / orbit.period) * orbit.direction;
  const angle = orbit.initialPhase + angularSpeed * time;

  const x0 = orbitRadius * Math.cos(angle);
  const y0 = orbitRadius * Math.sin(angle);

  const cosX = Math.cos(orbit.tiltX);
  const sinX = Math.sin(orbit.tiltX);
  const x1 = x0;
  const y1 = y0 * cosX;
  const z1 = -y0 * sinX;

  const cosZ = Math.cos(orbit.tiltZ);
  const sinZ = Math.sin(orbit.tiltZ);
  const x2 = x1 * cosZ - y1 * sinZ;
  const y2 = x1 * sinZ + y1 * cosZ;
  const z2 = z1;

  const distFromCenter = Math.hypot(x2, y2);
  const isOccluded = z2 < 0 && distFromCenter < planetRadius;

  return { name: orbit.text, x: Math.round(x2), y: Math.round(y2), z: Math.round(z2), dist: Math.round(distFromCenter), occluded: isOccluded };
}

for (const t of [0, 6, 14, 22]) {
  console.log(`--- TIME: ${t}s ---`);
  for (const o of ORBIT_LABELS) {
    console.log(project(o, t));
  }
}
