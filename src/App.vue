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
          <div v-if="!hasLoadedFile">
            <UploadField v-on:uploaded="(files) => parseFiles(files)"/>
          </div>
          <div v-else-if="isParsingFile">
            <p class="typography heading-two">Her jobbas det!<p/>
            <VTFKSpinner size="xlarge"/>
          </div>
          <div v-else class="center-content">
            <!-- Kart komponent -->
            <Map style="margin-top: 2rem;" :coordinates="polygon" :center="mapCenter"/>
            <!-- Cards som viser stats om informasjonen -->
            <StatCards style="margin-top: 1rem"/>
            <!-- Angreknapp -->
            <VTFKButton style="margin-top: 1rem" :passedProps="{ onClick: () => { this.hasLoadedFile = false; }}">Angre</VTFKButton>
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
      polygon: [],
      error: '',
    }
  },
  methods: {
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
      // let dxf_files = files.filter((f) => f.name.toLowerCase().endsWith('.dxf'));
      this.hasLoadedFile = true;
      this.isParsingFile = true;
      let dxf_files = files;

      if(dxf_files.length <= 0) { return; } //TODO: Throw feil

      let file = dxf_files[0];
      if(!file) { return } // TODO: Throw feil
      let fileData = await this.readFile(file.data);

      var parser = new DxfParser();
      let parsed = parser.parseSync(fileData);

      // TODO: Sjekk at entities kun har ett item
      // Sjekk også at typen er LWPOLYLINE

      let vertices = parsed.entities[0].vertices;
      // console.log('Polygon før transformasjon')
      // console.log(vertices);
      // // console.log(parsed.enteties[0]);
      
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

      // let transformed = proj4('EPSG:25832', 'EPSG:4326', vertices[0]);
      // let lowX = null;
      // let highX = null;
      // let highY = null;
      // let lowY = null;
      let sumX = null;
      let sumY = null;
      let transformedVertices = [];
      vertices.forEach((vertice) => {
        // Make a copy of the vertice to not modify the source object
        let vCopy = JSON.parse(JSON.stringify(vertice))
        // Transform the coordinates
        let transformed = proj4('EPSG:25832', 'EPSG:4326', vCopy);

        // if(vertice.x > highX) { highX = vertice.x }
        // else if(vertice.x < lowX) { lowX = vertice.x }
        // if(vertice.y > highY) { highY = vertice.y }
        // else if(vertice.y < lowY) { lowY = vertice.y }

        // Add 
        sumX += vertice.x;
        sumY += vertice.y;

        transformedVertices.push([transformed.y, transformed.x]);
      })

      // Calculate midpoint
      let transformedCenter = proj4('EPSG:25832', 'EPSG:4326', {x: sumX / transformedVertices.length, y: sumY / transformedVertices.length});
      // let transformedCenter = proj4('EPSG:25832', 'EPSG:4326', { x: (lowX + highX) / 2, y: (lowY + highY) / 2 });

      this.mapCenter = [transformedCenter.y, transformedCenter.x];

      this.polygon = transformedVertices;

      this.isParsingFile = false;
      

      // TODO: Sjekk at antall transformerte er samme som input antall

      // console.log(transformedVertices);

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
</style>
