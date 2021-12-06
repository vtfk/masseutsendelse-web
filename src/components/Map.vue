<template>
  <div class="map-wrapper">
    <l-map ref="map" style="height: 100%; min-height: 400px; width: 100%; z-index: 1;" :zoom="mapZoom" :center="mapCenter" v-on:ready="onMapReady()" >
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      <!-- <l-marker v-for="(marker, i) in markers" :key="(i + 1) * (Math.random() * 100000)" :lat-lng="marker"></l-marker> -->
      
      <l-marker v-if="extremes.north" :lat-lng="extremes.north">
        <l-icon :icon-url="require('@/assets/icons/north-bound.svg')" />
      </l-marker>
      <l-marker v-if="extremes.west" :lat-lng="extremes.west">
        <l-icon :icon-url="require('@/assets/icons/west-bound.svg')" :icon-anchor="[30, 25]"/>
      </l-marker>
      <l-marker v-if="extremes.east" :lat-lng="extremes.east">
        <l-icon :icon-url="require('@/assets/icons/east-bound.svg')" :icon-anchor="[-5, 20]"/>
      </l-marker>
      <l-marker v-if="extremes.south" :lat-lng="extremes.south">
        <l-icon :icon-url="require('@/assets/icons/south-bound.svg')" :icon-anchor="[10, 0]" />
      </l-marker>
      <l-polygon v-for="(p, i) in polygonArray" :key="(Math.random() * 10000) * (i + 1)" :lat-lngs="p.vertices" :fillColor="polygon.fillColor" :color="polygon.color"></l-polygon>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LPolygon, LIcon } from 'vue2-leaflet';

// Fix a bug where map markers are not shown
import { Icon } from 'leaflet';
import polyparser from '../lib/polyparser/polyparser';
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
    showCenterPin: {
      type: Boolean,
      default: true
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
      type: Object
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
      polygonArray: undefined,
      extremes: undefined,
    }
  },
  methods: {
    invalidateMapSize() {
      this.$refs.map.mapObject.invalidateSize(); 
    },
    parsePolygons(polygons) {
      // Input validation
      if(!polygons) return [];

      // Transform vertices if applicable
      let pindex = -1;
      for(let polygon of polygons.polygons) {
        pindex++;
        let vindex = -1;
        for(let vertice of polygon.vertices) {
          vindex++;
          polygons.polygons[pindex].vertices[vindex] = polyparser.swapXY(polyparser.transformCoordinates(polygon.EPSG || undefined, undefined, vertice));
        }
      }

      // Transform center
      this.mapCenter = polyparser.swapXY(polyparser.transformCoordinates(this.polygon.EPSG, undefined, polygons.center));

      // Transform extremes
      this.extremes = {
        north: polyparser.swapXY(polyparser.transformCoordinates(this.polygon.EPSG, undefined, polygons.extremes.north)),
        west: polyparser.swapXY(polyparser.transformCoordinates(this.polygon.EPSG, undefined, polygons.extremes.west)),
        east: polyparser.swapXY(polyparser.transformCoordinates(this.polygon.EPSG, undefined, polygons.extremes.east)),
        south: polyparser.swapXY(polyparser.transformCoordinates(this.polygon.EPSG, undefined, polygons.extremes.south)),
      }
      
      this.$set(this, 'polygonArray', polygons.polygons);
    },
    onMapReady() {
      // Zoom the map to fit the extremes
      const bounds = [this.extremes.north, this.extremes.west, this.extremes.east, this.extremes.south];
      this.$refs.map.mapObject.fitBounds(bounds);
    }
  },
  created() {
    this.parsePolygons(this.$props.polygons);
    this.$set(this, 'polygonArray', this.polygonArray);
  },
  beforeDestroy() {
  },
  mounted() {
    setTimeout(() => {
      this.invalidateMapSize();
    }, 100);
  },
  watch: {
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