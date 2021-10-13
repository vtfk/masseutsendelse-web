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
          <!-- Cards som viser stats om informasjonen -->
          <StatCards style="margin-top: 1rem"/>
          <!-- Angreknapp -->
          <VTFKButton style="margin-top: 1rem" :passedProps="{ onClick: () => { this.hasLoadedFile = false; }}">Angre</VTFKButton>
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
      hasLoadedFile: false
    }
  },
  methods: {
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
