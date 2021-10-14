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
          <GuideBtnModal style="margin-top: 1rem;"/>
        </div>
        
        <!-- Upload felt -->
        <div v-if="!hasLoadedFile">
          <UploadField v-on:uploaded="() => hasLoadedFile = true"/>
        </div>
        <div v-else class="center-content">
          <!-- Kart komponent -->
          <Map style="margin-top: 2rem;"/>
          <!-- Knapp for å hente data fra API -->
          <VTFKButton style="margin-top: 1rem" :passedProps="{ onClick: () => getDataFromMatrikkelAPI() }">Hent matrikkel infromasjon</VTFKButton>
          <!-- Cards som viser stats om informasjonen -->
          <StatCards style="margin-top: 1rem"/>
          <!-- Angreknapp -->
          <VTFKButton style="margin-top: 1rem">Angre</VTFKButton>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
// VTFK komponenter
import { Button } from '@vtfk/components'

// Prosjektkomponenter
import Header from './components/Header.vue'
import GuideBtnModal from './components/GuideBtnModal.vue'
import UploadField from './components/UploadField.vue'
import Map from './components/Map.vue'
import StatCards from './components/StatCards.vue'

// Import libraries
import MatrikkelProxyClient from './lib/matrikkelProxyClient'

export default {
  name: 'App',
  components: {
    Header,
    'VTFKButton': Button,
    GuideBtnModal,
    UploadField,
    Map,
    StatCards
  },
  data() {
    return {
      isSpinning: false,
      isShowModal: false,
      hasLoadedFile: true,
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
    }
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
