<template>
  <div style="margin-left: 4rem; margin-right: 4rem">
    <h1 style="margin-bottom: 0.2rem;">Development</h1>
    <p>This route is only accessible while in development-mode</p>
    <uploader v-model="files" />
    <h1>Login</h1>
    <div style="display: flex; gap: 1rem;">
      <v-btn @click="loginAzure()">Login azure (popup)</v-btn>
      <v-btn @click="authenticateMasseutsendelse()">Login Azure (redirection)</v-btn>
    </div>
    <div v-if="true">
      Logged in as: 
    </div>
  </div>
</template>

<script>
/*
  Import components
*/
import Uploader from '../components/uploader/UploadField.vue'
const Auth = require('../authentication');
// import * as msal from "@azure/msal-browser";

// const config = {
//   auth: {
//     clientId: 'ffd9d6ce-d313-4d5d-a758-0affa6dadd0a',
//     authority: "https://login.microsoftonline.com/08f3813c-9f29-482f-9aec-16ef7cbf477a",
//   }
// }
// const instance = new msal.PublicClientApplication(config);

export default {
  name: 'DevelopmentView',
  components: {
    Uploader
  },
  data() {
    return {
      files: []
    }
  },
  methods: {
    async loginAzure() {
      const config = {
        auth: {
          clientId: 'ffd9d6ce-d313-4d5d-a758-0affa6dadd0a',
          authority: "https://login.microsoftonline.com/08f3813c-9f29-482f-9aec-16ef7cbf477a",
        }
      }
      const azureAuth = new Auth('azure', config);

      await azureAuth.login();
    },
    async authenticateMasseutsendelse() {
      const config = {
        auth: {
          clientId: 'ffd9d6ce-d313-4d5d-a758-0affa6dadd0a',
          authority: "https://login.microsoftonline.com/08f3813c-9f29-482f-9aec-16ef7cbf477a",
        }
      }
      const masseutsendelseAuth = new Auth('azure', config);

      await masseutsendelseAuth.loginRedirection();
    }
  },
  async mounted() {
    const config = {
      auth: {
        clientId: 'ffd9d6ce-d313-4d5d-a758-0affa6dadd0a',
        authority: "https://login.microsoftonline.com/08f3813c-9f29-482f-9aec-16ef7cbf477a",
      }
    }
    const masseutsendelseAuth = new Auth('azure', config);
    await masseutsendelseAuth.handleRedirection();
  }
}
</script>

<style>

</style>