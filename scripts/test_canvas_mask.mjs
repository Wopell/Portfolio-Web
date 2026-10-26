import * as topojson from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';
import landTopology from 'world-atlas/land-110m.json' with { type: 'json' };

console.log('Topology objects:', Object.keys(landTopology.objects));
const land = topojson.feature(landTopology, landTopology.objects.land);
console.log('Land feature ready:', land.type);
