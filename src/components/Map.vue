<template>
  <div class="map-wrapper">
    <l-map ref="mymap" style="height: 100%; min-height: 400px; width: 100%; z-index: 1;" :zoom="mapZoom" :center="mapCenter">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      <!-- <l-marker v-for="(marker, i) in markers" :key="(i + 1) * (Math.random() * 100000)" :lat-lng="marker"></l-marker> -->
      
      <l-marker v-if="$props.outerBounds && $props.outerBounds.north" :lat-lng="$props.outerBounds.north">
        <l-icon :icon-url="require('@/assets/icons/north-bound.svg')" />
      </l-marker>
      <l-marker v-if="$props.outerBounds && $props.outerBounds.west" :lat-lng="$props.outerBounds.west">
        <l-icon :icon-url="require('@/assets/icons/west-bound.svg')" :icon-anchor="[30, 25]"/>
      </l-marker>
      <l-marker v-if="$props.outerBounds && $props.outerBounds.east" :lat-lng="$props.outerBounds.east">
        <l-icon :icon-url="require('@/assets/icons/east-bound.svg')" :icon-anchor="[-5, 20]"/>
      </l-marker>
      <l-marker v-if="$props.outerBounds && $props.outerBounds.south" :lat-lng="$props.outerBounds.south">
        <l-icon :icon-url="require('@/assets/icons/south-bound.svg')" :icon-anchor="[10, 0]" />
      </l-marker>
      <l-polygon v-for="(p, i) in $props.polygons" :key="(Math.random() * 10000) * (i + 1)" :lat-lngs="p" :fillColor="polygon.fillColor" :color="polygon.color"></l-polygon>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LPolygon, LIcon } from 'vue2-leaflet';
// import { icon } from 'leaflet';

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
    LPolygon,
    LIcon
  },
  props: {
    center: {
      type: Array,
      default: () => [59.2654381, 10.4159352]
    },
    markers: {
      type: Array,
      default: () => [[59.2654381, 10.4159352]]
    },
    outerBounds: {
      type: Object,
    },
    lineColor: {
      type: String,
      default: '#007ACC'
    },
    fillColor: {
      type: String,
      default: '#007ACC'
    },
    zoom: {
      type: Number,
      default: 14
    },
    polygons: {
      type: Array,
      default: () => [[59.265790569079115, 10.414842612222685],[59.26597348643685, 10.415928717894104], [59.26564549599459, 10.416589020770118], [59.26526073395536, 10.416570507602557], [59.26505573601051, 10.416811178747423], [59.26498950564053, 10.416218757477424], [59.265790569079115, 10.414842612222685]]
    }
  },
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      mapZoom: this.$props.zoom,
      mapCenter: this.$props.center,
      mapMarker: this.$props.marker,
      polygon: {
        color: this.$props.lineColor,
        fillColor: this.$props.fillColor,
      },
    }
  },
  methods: {
    invalidateMapSize() {
      this.$refs.mymap.mapObject.invalidateSize(); 
    }
  },
  created() {
    // document.addEventListener('resize', () => console.log('Hei'));
  },
  beforeDestroy() {
    // document.removeEventListener('resize', () => this.invalidateMapSize());
  },
  mounted() {
    setTimeout(() => {
      this.invalidateMapSize();
    }, 100);
  }
}
</script>

<style scoped>
  .map-wrapper {
    height: 100%;
    width: 100%;
    box-shadow: 0px 1px 5px 1px #888888;
  }
</style>