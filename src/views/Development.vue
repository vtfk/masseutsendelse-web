<template>
  <div style="margin-left: 4rem; margin-right: 4rem">
    <h1 style="margin-bottom: 0.2rem;">Development</h1>
    <p>This route is only accessible while in development-mode</p>
    <uploader v-model="files" :disabled="isDisabled" />
    <v-checkbox v-model="isDisabled" label="Uploader disabled" />
    <h1>Login</h1>
    <div style="display: flex; gap: 1rem;">
      <v-btn @click="loginAzure()">Login azure (popup)</v-btn>
      <v-btn @click="authenticateMasseutsendelse()">Login Azure (redirection)</v-btn>
    </div>
    <div v-if="$authenticatedUser()">
      Logged in as: {{ $authenticatedUser().name }}
    </div>
    <div style="margin-top: 2rem">
      <v-btn @click="captureError()">Capture error in sentry</v-btn>
    </div>
    <div>
      <h1>Ekskluderte brukere</h1>
      <table>
        <tbody>
          <tr>
            <th>Navn</th>
            <th>Grunn</th>
          </tr>
          <tr v-for="(usr, i) in excludedOwners" :key="i">
            <td>{{usr.navn}}</td>
            <td>{{usr.exclusionReason}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
/*
  Import components
*/
import config from '../../config';
import Uploader from '../components/uploader/UploadField.vue'
import * as Sentry from '@sentry/vue';
const Auth = require('../authentication');

export default {
  name: 'DevelopmentView',
  components: {
    Uploader
  },
  data() {
    return {
      files: [],
      isDisabled: false,
      excludedOwners: [],
    }
  },
  methods: {
    captureError() {
      const err = new Error('Dette er en test feil');
      Sentry.captureException(err);
    },
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
  async created() {
    let ownerCentric = require('./users.json');
    let excludedOwners = [];
    console.log('All owners: ' + ownerCentric.length);
    // console.log(ownerCentric);
    // Exculde owners
    for(let owner of ownerCentric) {
      let excludedReason = undefined;

      // Manually handle (Adresse sperre)
      if(owner.dsf) {
        const spesCode = parseInt(owner.dsf['SPES-KD'])
        const statCode = parseInt(owner.dsf['STAT-KD'])
        if(statCode) {
          if(statCode === 3) excludedReason = 'Utvandret';
          if(statCode === 4) excludedReason = 'Forsvunnet';
          if(statCode === 5) excludedReason = 'Død';
        }
        if(spesCode && (spesCode === 4 || spesCode === 6 || spesCode === 7)) {
          excludedReason = 'Må håndteres manuelt';
          owner.hardExluded = true;
        }
      }

      // Handle manually
      if(owner.manuallyHandle === true || owner.handleManually === true) {
        excludedReason = 'Må håndteres manuelt';
        owner.hardExluded = true;
      }

      // Utvandret
      if(owner.utvandret) {
        excludedReason = 'Utvandret';
      }

      // Forsvunnet
      if(owner.forsvunnet) {
        excludedReason = 'Forsvunnet';
      }

      // Dead owners
      if((owner.dead === true) || (owner && owner.name && owner.name.includes('DØDSBO'))) {
        excludedReason = 'Død';
      }

      // Pre-excluded person or org numbers
      if(config.EXCLUDED_OWNER_IDS && Array.isArray(config.EXCLUDED_OWNER_IDS) && config.EXCLUDED_OWNER_IDS.includes(owner.nummer)) {
        excludedReason = 'Forhåndsekskludert';
      }

      if(excludedReason) {
        owner.exclusionReason = excludedReason;
        excludedOwners.push(owner);
      }
    }

    console.log('Excluded owners: ' + excludedOwners.length);

    if(excludedOwners.length !== 0) {
      let excludedIds = excludedOwners.map((o) => o.nummer);
      ownerCentric = ownerCentric.filter((o) => !excludedIds.includes(o.nummer));
    } else {
      console.log('All good');
    }

    console.log('All owners after exclusion: ' + ownerCentric.length);

    console.log('=== Excluded owners ===');
    console.log(excludedOwners);
    this.excludedOwners = excludedOwners;
  },
  async beforeDestroy() {
  },
}
</script>

<style>

</style>