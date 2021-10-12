<template>
  <div id="app">
    <header class="container">
      <Header />
    </header>
    <div class="container">
      <!-- Informasjonstekst -->
      <div>
        <div class="typography heading-two header-title">Header</div>
        <div class="typography paragraph">
          Her blir det
          noe
          tekst
        </div>
        <GuideBtnModal />
      </div>
      <!-- Upload felt -->
      <div v-if="!hasLoadedFile">
        <UploadField v-on:uploaded="() => hasLoadedFile = true"/>
      </div>
      <div v-else>
        <!-- Kart komponent -->
        <Map />
        <!-- Cards som viser stats om informasjonen -->
        <!-- Angreknapp -->
        <VTFKButton>Angre</VTFKButton>
      </div>
    </div>
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

export default {
  name: 'App',
  components: {
    Header,
    'VTFKButton': Button,
    GuideBtnModal,
    UploadField,
    Map
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
  }

  .container {
    display: flex;
    justify-content: center;
    padding-top: 4rem;
    padding-left: 1rem;
    padding-right: 1rem;
    max-width: 1100px;
    margin: 0 auto;
  }



</style>
