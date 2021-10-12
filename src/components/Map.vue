<template>
  <div class="map-wrapper">
    <l-map style="height: 400px; width: 750px; max-width: 800px;" :zoom="zoom" :center="center">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      <l-marker :lat-lng="markerLatLng"></l-marker>
      <l-polygon :lat-lngs="polygon.coordinates" :fillColor="polygon.fillColor" :color="polygon.color"></l-polygon>
    </l-map>
  </div>
</template>

<script>
// import L from 'leaflet';
import { LMap, LTileLayer, LMarker, LPolygon } from 'vue2-leaflet';

// Fix a bug where map markers are not shown
import { Icon } from 'leaflet';
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default {
  name: 'Map',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPolygon
  },
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      zoom: 16.5,
      center: [59.2654381, 10.4159352],
      markerLatLng: [59.2654381, 10.4159352],
      polygon: {
        color: '#007ACC',
        fillColor: '#007ACC',
        coordinates: [[59.265790569079115, 10.414842612222685],[59.26597348643685, 10.415928717894104], [59.26564549599459, 10.416589020770118], [59.26526073395536, 10.416570507602557], [59.26505573601051, 10.416811178747423], [59.26498950564053, 10.416218757477424], [59.265790569079115, 10.414842612222685]]
      }
    }
  }
}
</script>

<style scoped>
  .map-wrapper {
    box-shadow: 0px 1px 5px 1px #888888;
  }
</style>