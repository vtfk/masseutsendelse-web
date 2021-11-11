<template>
  <div id="app" data-app>
    <v-app>
      <header>
        <div class="container">
          <Header />
        </div>
      </header>
      <main>
        <router-view>
        </router-view>
      </main>
    </v-app>
  </div>
</template>

<script>
import Header from './components/Header.vue'

export default {
  name: 'App',
  components: {
    Header,
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
    /* text-align: center; */
    background: rgba(190,218,202,.3);
    overflow: hidden;
    overflow-y: auto;
  }

  .container {
    padding-top: 4rem;
    padding-left: 1rem;
    padding-right: 1rem;
    max-width: 1200px!important;
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

  .text-center {
    text-align: center;
  }

  .centered {
    margin: 0 auto;
  }

  .shadow {
    box-shadow: 0px 1px 5px 1px #888888;
  }

  .mt-1 {
    margin-top: 1rem;
  }

  .centeredColumn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
</style>
