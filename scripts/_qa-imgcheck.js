(() => {
  const imgs = [...document.querySelectorAll('img')];
  const bad = imgs.filter((x) => x.complete && x.naturalWidth === 0);
  return JSON.stringify({
    total: imgs.length,
    bad: bad.length,
    srcs: [...new Set(bad.map((x) => x.getAttribute('src')))],
  });
})()
