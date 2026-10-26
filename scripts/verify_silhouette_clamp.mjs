// Verification script for silhouette clamping with warpMax = 10 on desktop and mobile

function testSilhouetteClamping(planetRadiusPx, dpr) {
  const u_radius = planetRadiusPx * dpr;
  const u_scale = (planetRadiusPx / 350.0) * dpr;
  const warpMax = 10.0;
  const scaledWarpMax = warpMax * u_scale;
  const pullStrength = 7.5 * u_scale;

  let violations = 0;
  let maxOuterDist = 0;

  // Test 100,000 points near the limb
  for (let i = 0; i < 100000; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Base position near or at limb
    const rBase = (0.7 + 0.3 * Math.random()) * u_radius;
    const basePos = { x: Math.cos(angle) * rBase, y: Math.sin(angle) * rBase };

    // Worst-case displacement in outward radial direction
    const pullOffset = { x: Math.cos(angle) * pullStrength, y: Math.sin(angle) * pullStrength };
    const warpOffset = { x: Math.cos(angle) * scaledWarpMax, y: Math.sin(angle) * scaledWarpMax };

    let displacedPos = {
      x: basePos.x + pullOffset.x + warpOffset.x,
      y: basePos.y + pullOffset.y + warpOffset.y
    };

    const finalRadiusCss = 2.5; // typical max dot radius in px
    const dotRadiusPx = finalRadiusCss * dpr;

    // Shader silhouette clamping
    const distCenter = Math.hypot(displacedPos.x, displacedPos.y);
    const maxAllowedSil = Math.max(0, u_radius - dotRadiusPx);
    if (distCenter > maxAllowedSil && distCenter > 0.001) {
      displacedPos.x = (displacedPos.x / distCenter) * maxAllowedSil;
      displacedPos.y = (displacedPos.y / distCenter) * maxAllowedSil;
    }

    const clampedDist = Math.hypot(displacedPos.x, displacedPos.y);
    const outerEdge = clampedDist + dotRadiusPx;
    if (outerEdge > maxOuterDist) maxOuterDist = outerEdge;

    // Tolerance of 1e-4 for floating point
    if (outerEdge > u_radius + 0.0001) {
      violations++;
    }
  }

  return {
    planetRadiusPx,
    dpr,
    u_radius,
    maxOuterDist,
    violations,
    marginToEdge: u_radius - maxOuterDist
  };
}

console.log('Desktop 1440px (R=350, DPR=1.5):', testSilhouetteClamping(350, 1.5));
console.log('Tablet 768px (R=270, DPR=1.5):', testSilhouetteClamping(270, 1.5));
console.log('Mobile 390px (R=156, DPR=2.0):', testSilhouetteClamping(156, 2.0));
console.log('Mobile 360px (R=144, DPR=2.0):', testSilhouetteClamping(144, 2.0));
