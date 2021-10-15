<template>
  <div id="app">
    <header>
      <div class="container">
        <Header />
      </div>
    </header>
    <main>
      <div class="container">
        <!-- Informasjonstekst -->
        <div style="display: flex; align-items: center; flex-direction: column;">
          <div class="typography heading-two header-title">Masseutsendelse</div>
          <p class="typography paragraph header-description" style="margin-top: 1rem;">
            Ett verktøy utviklet for Samferdesel og mobilitets sektoren.<br/>
            Verktøyet lar deg laste opp en polygon fil, gjøre oppslag i Matrikkelen og varsle alle eiere som befinner seg innenfor polygonet.
          </p>
          <div style="display: flex; flex-direction: row;">
            <div style="margin-right: 2rem;">
              <GuideBtnModal style="margin-top: 1rem;"/>
            </div>
            <TableBtnModal style="margin-top: 1rem;"/>
          </div>
        </div>
        <!-- Upload felt -->
        <div style="margin-top: 1rem;">
          <div v-if="error" class="error-card">
            <h1>En feil har oppstått</h1>
            <h3 v-if="error.title">{{error.title}}</h3>
            <p v-if="error.message">{{error.message}}</p>
            <strong>Stack:</strong>
            <p style="text-align: left;">{{error.stack}}</p>
            <div style="display: flex; justify-content: center;">
              <VTFKButton style="margin-top: 1rem;" :passedProps="{onClick: () => {reset(true)}}">Start på nytt</VTFKButton>
            </div>
          </div>
          <div v-else-if="!hasLoadedFile">
            <UploadField v-on:uploaded="(files) => parseFiles(files)"/>
          </div>
          <div v-else-if="isParsingFile">
            <p class="typography heading-two">Her jobbas det!<p/>
            <VTFKSpinner size="xlarge"/>
          </div>
          <div v-else class="center-content">
            <!-- Kart komponent -->
            <Map style="margin-top: 2rem;" :coordinates="polygon" :center="mapCenter" :markers="markers"/>
            <!-- Knapp for å hente data fra API -->
            <VTFKButton style="margin-top: 1rem" :passedProps="{ onClick: () => getDataFromMatrikkelAPI() }">Hent matrikkel infromasjon</VTFKButton>
            <!-- Cards som viser stats om informasjonen -->
            <StatCards style="margin-top: 1rem" :items="statItems"/>
            <!-- Angreknapp -->
            <VTFKButton style="margin-top: 1rem" :passedProps="{onClick: () => {reset()}}">Angre</VTFKButton>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
// VTFK komponenter
import { Button, Spinner } from '@vtfk/components'

// Prosjektkomponenter
import Header from './components/Header.vue'
import GuideBtnModal from './components/GuideBtnModal.vue'
import TableBtnModal from './components/TableBtnModal.vue'
import UploadField from './components/UploadField.vue'
import Map from './components/Map.vue'
import StatCards from './components/StatCards.vue'

// Import libraries
import MatrikkelProxyClient from './lib/matrikkelProxyClient'
import DxfParser from 'dxf-parser'
import proj4 from 'proj4';

// Error klasse
class AppError extends Error {
  constructor(title, message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.title = title;
  }
}

export default {
  name: 'App',
  components: {
    Header,
    'VTFKButton': Button,
    'VTFKSpinner': Spinner,
    GuideBtnModal,
    TableBtnModal,
    UploadField,
    Map,
    StatCards
  },
  data() {
    return {
      isSpinning: false,
      isShowModal: false,
      hasLoadedFile: false,
      isParsingFile: false,
      mapCenter: [],
      markers: [],
      polygon: [],
      statItems: [],
      error: undefined,
    }
  },
  methods: {
    setError(error) {
      this.error = error;
    },
    reset(force = false) {
      if(force === false) {
        if(!confirm('Er du helt sikker på at du vil starte på nytt?')) {
          return;
        }
      }

      // Action states
      this.state = 'initial';
      this.isShowModal = false;
      this.hasLoadedFile = false;
      this.isParsingFile = false;

      // Data
      this.markers = [];
      this.mapCenter = [];
      this.polygon = [];
      this.statItems = [];
      this.error = undefined;
    },
    async getDataFromMatrikkelAPI(polygon) {
      if(!polygon) {
        polygon = [
          {
              x: 9.061226825863429,
              y: 59.417888839303345,
              z: 0
          },
          {
              x: 9.06059789499838,
              y: 59.41877340387384,
              z: 0
          },
          {
              x: 9.062418554835972,
              y: 59.41876773278693,
              z: 0
          },
          {
              x: 9.062615483212653,
              y: 59.418047496800966,
              z: 0
          },
          {
              x: 9.061226825863429,
              y: 59.417888839303345,
              z: 0
          }
        ]
      }

      let matrikkelClient = new MatrikkelProxyClient();

      // Hent ut alle MatrikkelEnhet-IDer innenfor polygonet
      let matrikkelEnhetIds = await matrikkelClient.getMatrikkelEnheter(polygon, { query: { flatten: true, metadata: false } });
      if(!matrikkelEnhetIds && matrikkelEnhetIds.length) { this.error = 'Kunne ikke laste inn noen matrikkelenheter innenfor dette polygonet. '; return; }

      // Lag ett request for å kontakte store-service for informasjon om enhetene
      let matrikkelEnhetItems = [];
      matrikkelEnhetIds.forEach((item) => {
        matrikkelEnhetItems.push({
          type: 'MatrikkelenhetId',
          namespace: 'http://matrikkel.statkart.no/matrikkelapi/wsapi/v1/domain/matrikkelenhet',
          value: item
        })
      })

      this.statItems.push({ text: 'Enheter', value: matrikkelEnhetItems.length })

      let matrikkelEnheter = await matrikkelClient.getStoreItems(matrikkelEnhetItems, { query: { flatten: true, metadata: false } });
      if(!matrikkelEnheter && matrikkelEnheter.length) { this.error = 'Kunne ikke laste inn noen matrikkelenheter innenfor dette polygonet. '; return; }

      console.log('Returned:')
      console.log(matrikkelEnheter);
    },
    async readFile(file) {
      // Always return a Promise
      return new Promise((resolve, reject) => {
        let content = '';
        const reader = new FileReader();
        // Wait till complete
        reader.onloadend = function(e) {
          content = e.target.result;
          // const result = content.split(/\r\n|\n/);
          resolve(content);
        };
        // Make sure to handle error states
        reader.onerror = function(e) {
          reject(e);
        };
        reader.readAsText(file);
      });
    },
    async parseFiles(files) {
      try {
        if(!files || files.length == 0) {
          throw new AppError('Filopplastings feil', 'Det ble påkallet en filopplasting, men ingen fil ble lastet opp')
        }
        let dxf_files = files.filter((f) => f.name.toLowerCase().endsWith('.dxf'));
        if(!dxf_files || dxf_files.length === 0) {
          throw new AppError('Feil filtype', 'Filen som ble lastet opp er av feil filtype. Filen må være av typen .dxf')
        }

        this.hasLoadedFile = true;
        this.isParsingFile = true;

        let file = dxf_files[0];
        let fileData = await this.readFile(file.data);

        if(!fileData || fileData.length === 0) { throw new AppError('Filen er tom', 'Den opplastede .dxf-filen inneholder ingen data') }

        var parser = new DxfParser();
        let parsed = parser.parseSync(fileData);

        if(!parsed.entities) { throw new AppError('Fil inneholder ingen former', 'Filen inneholder ingen former') }

        let polygons = parsed.entities.filter((i => i.type === 'LWPOLYLINE'));
        if(polygons.length == 0) { throw new AppError('Fil inneholder ingen polygoner', 'Filen inneholder ingen polygoner') }
        else if(polygons.length > 1) { throw new AppError('Fil inneholder ingen polygoner', ('Filen må kun inneholde ett polygon, men det inne holder ' + polygons.length))  }

        const polygon = polygons[0];
        if(!polygon || !polygon.vertices || polygon.vertices.length === 0) {
          throw new AppError('Polygonet mangler linjesegmenter', ('Polygonet i filen inneholder ingen linjesegmenter'))
        }
 
        let vertices = polygons[0].vertices;

        // Define the coordinate translations
        proj4.defs([
          [
            'EPSG:4326',
            '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
          [
            'EPSG:25832',
            '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs'
          ]
        ]);

        let lowX = vertices[0].x;
        let highX = vertices[0].x;
        let lowY = vertices[0].y;
        let highY = vertices[0].y;
        
        let northPoint = undefined;
        let westPoint = undefined;
        let eastPoint = undefined;
        let southPoint = undefined;

        let transformedVertices = [];
        // let firstLatitude = vertices[0].y;
        vertices.forEach((vertice) => {
          // Make a copy of the vertice to not modify the source object
          let vCopy = JSON.parse(JSON.stringify(vertice))
          // Transform the coordinates
          let transformed = proj4('EPSG:25832', 'EPSG:4326', vCopy);
          // Find the outermost points, used for calculating the center of the polygon
          if(vertice.x > highX) { westPoint = vertice; highX = vertice.x; }
          else if(vertice.x < lowX) { eastPoint = vertice; lowX = vertice.x; }
          if(vertice.y > highY) { northPoint = vertice; highY = vertice.y; }
          else if(vertice.y < lowY) { southPoint = vertice; lowY = vertice.y }
          // Add the transformed points to the transformed array
          transformedVertices.push([transformed.y, transformed.x]);
        })

        // Calculate midpoint
        let transformedCenter = proj4('EPSG:25832', 'EPSG:4326', {x: (lowX + highX) / 2, y: (lowY + highY) / 2});

        // Calculate the coordinates for the outmost points
        let translatedNorth = proj4('EPSG:25832', 'EPSG:4326', {x: northPoint.x , y: northPoint.y});
        let translatedWest = proj4('EPSG:25832', 'EPSG:4326', {x: westPoint.x , y: westPoint.y});
        let translatedEast = proj4('EPSG:25832', 'EPSG:4326', {x: eastPoint.x , y: eastPoint.y});
        let translatedSouth = proj4('EPSG:25832', 'EPSG:4326', {x: southPoint.x , y: southPoint.y});

        // Set the center of the map
        this.mapCenter = [transformedCenter.y, transformedCenter.x];

        // Add markers for the outermost points
        this.markers.push([transformedCenter.y, transformedCenter.x]);
        this.markers.push([translatedNorth.y, translatedNorth.x]);
        this.markers.push([translatedWest.y, translatedWest.x]);
        this.markers.push([translatedEast.y, translatedEast.x]);
        this.markers.push([translatedSouth.y, translatedSouth.x]);

        // Set the polygon the be the transformed vertices
        this.polygon = transformedVertices;

        // Set that the file has been parsed
        this.isParsingFile = false;
      } catch (err) {
        this.setError(err);
        console.error(err.stack);
      }
    }
  },
  created() {
  }
}

</script>

<style>
  :root {
    --side-padding: 4rem;
  } 

  #app {
    width: 100vw;
    height: 100vh;
    text-align: center;
    background: rgba(190,218,202,.3);
    overflow: hidden;
    overflow-y: auto;
  }

  .container {
    padding-top: 4rem;
    padding-left: 1rem;
    padding-right: 1rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .center-content {
    width: 100%;
    text-align:center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .centered {
    margin: 0 auto;
  }

  .error-card {
    width: 100%;
    min-height: 250px;
    background-color: #F8D3D1;
    border-radius: 10px; 
    padding: 1rem 1rem;
  }
</style>
