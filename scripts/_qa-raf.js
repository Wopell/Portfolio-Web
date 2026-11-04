(async () => {
  const t0 = performance.now();
  let frames = 0;
  await new Promise((done) => {
    const tick = () => {
      frames += 1;
      if (performance.now() - t0 < 600) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  });
  const elapsed = performance.now() - t0;
  const heading = document.querySelector('h1, h2');
  return JSON.stringify({
    frames,
    avgFrameMs: Math.round((elapsed / frames) * 100) / 100,
    headingOpacity: heading ? getComputedStyle(heading).opacity : 'no-heading',
  });
})()
