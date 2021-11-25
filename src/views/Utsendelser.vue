<template>
  <div class="container">
    <h2 class="typography heading-two" style="margin: 2rem;">Utsendelser</h2>
    <ErrorField v-if="error" :error="error"/>
    <Loading v-else-if="!$store.state.dispatches" title="Laster utsendelser" message="Dette kan ta noen sekunder" />
    <div v-else>
      <v-card style="padding-bottom:2rem;">
        <v-card-title class="typography heading-three">
          Prosjekter
          <v-spacer/>
          <v-text-field
            v-model="search"
            label="Søk i tabell"
            append-icon="mdi-magnify"
            single-line
            hide-details
            style="margin-right: 1rem"
          ></v-text-field>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="$store.state.dispatches"
          :items-per-page="5"
          fixed-header
          class="elevation-1"
          style="margin: 2rem;"
          :search="search"
          :loading="!$store.state.dispatches"
          loading-text="Laster data fra databasen "
        >
          <template v-slot:[`item.createdTimestamp`]="{ item }">
            {{formatDateString(item.createdTimestamp)}}
          </template>
          <template v-slot:[`item.status`]="{ item }">
            <v-chip
              :color="getColor(item.status)"
            >
              {{translateStatus(item.status)}}
            </v-chip>
          </template>
          <template v-slot:[`item.handlinger`]="{ item }">
            <v-icon
              medium
              style="padding-right:0.2rem;"
              @click="editItem1(item)"
            >
              mdi-pencil
            </v-icon>
            <v-icon
              medium
              style="padding-right:0.2rem;"
              @click="previewPDF(item)"
            >
              mdi-note-search 
            </v-icon>
            <v-icon
              medium
              @click="openMap(item)"
            >
              mdi-map-search 
            </v-icon>
        </template>
        </v-data-table>
      </v-card>
    </div>
    <!-- MODALER/DIALOGER -->
      <!-- Edit dialog -->
      <v-dialog
        v-if="editedItem"
        :value="true"
        width="80%"
        @click:outside="editedItem = undefined"
      >
        <v-card>
          <v-card-title>
          Rediger 
          </v-card-title>
          <v-card-text>
            <DispatchEditor :dispatchObject="editedItem" @saved="editedItem = undefined" @close="editedItem = undefined"/>
          </v-card-text>
        </v-card>
      </v-dialog>
      <!-- Map dialog -->
      <v-dialog
        v-if="dialogMap"
        v-model="dialogMap"
        width="80%"
      >
        <v-card>
          <v-card-title>
            Kart
          </v-card-title>
          <v-card-text>
            <Map :coordinates="selectedDispatch.geopolygon.vertices" :center="selectedDispatch.geopolygon.extremes.center" :markers="[selectedDispatch.geopolygon.extremes.center]"/>
          </v-card-text>
          <v-card-actions style="display:flex; gap:1rem;" class="centerbtn">
            <VTFKButton 
              type='secondary' size='small' style="padding-bottom: 1rem;"
              :passedProps="{ onClick: () => [dialogMap = false] }"
              >Lukk
            </VTFKButton>
          </v-card-actions>
        </v-card>
      </v-dialog>
    <!-- Alerts -->
    <v-alert 
      :value="alert_success" 
      type="success"
      color="#91B99F"
      width="50%"
      rounded="xl"
      transition="slide-y-transition"
    >
      Statusen er lagret.
    </v-alert>
  </div>
</template>

<script>
// VTFK komponenter
import { Button } from '@vtfk/components'

// Prosjekt komponenter
import Loading from '../components/Loading.vue';
import Map from '../components/Map.vue';
import DispatchEditor from '../components/DispatchEditor.vue';
import AppError from '../lib/vtfk-errors/AppError';

  export default {
    name: 'UtsendelserView',
    components: {
        'VTFKButton': Button,
        Loading,
        Map,
        DispatchEditor,
    },
    data () {
      return {
        error: undefined,
        dispatches: [],
        editedItem: undefined,
        search: '',
        dialogEdit: false,
        dialogMap:false,
        loading:false,
        selectedDispatch: undefined,
        alert_success: false,
        headers: [
          {
            text: 'Prosjekt',
            align: 'start',
            sortable: true,
            value: 'title',
          },
          {text: 'Prosjekt Nr', value: 'projectnumber'},
          {text: 'Dato', value: 'createdTimestamp'},
          {text: 'Status', value: 'status'},
          {text: 'Oppretshaver', value: 'createdBy'},
          {text: 'Behandlet av', value: 'modifiedBy'},
          {text: 'Handlinger', value: 'handlinger', sortable:false}
        ],
        select: {status_valg: '', status_value: ''},
        items: [
          { status_valg: 'Godkjent', status_value: 'approved'},
          { status_valg: 'Under behandling', status_value: 'notapproved'},
          { status_valg: 'Utsendelse Pågår', status_value: 'inprogress'},
          { status_valg: 'Fullført', status_value: 'completed'},
        ],
      }
    },
    async mounted() {
      // Get all dispatched from DB
      this.loadDataBase()
    },
    methods: {
      getColor (status) {
        if (status == "approved") return '#D0C788'
        else if (status == "notapproved") return '#E7827E'
        else if (status == "completed") return '#91B99F'
        else if (status == "inprogress") return '#E0C38B'
        else return '#FFFFF'
      },
      translateStatus (status) {
        if (status == "completed") return "Fullført"
        else if (status == "inprogress") return "Utsendelse Pågår"
        else if (status == "approved") return "Godkjent"
        else if (status == "notapproved") return "Under Behandling"
      },
      formatDateString(dateString) {
        try {
          const date = new Date(dateString);
          const day = date.getDate().toString().padStart(2, '0');
          const month = date.getMonth().toString().padStart(2, '0');
          const hour = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0')
          return day + '.' + month + '.' + date.getFullYear() + ' - ' + hour + ':' + minutes;
        } catch {
          return dateString;
        }
      },
      async loadDataBase() {
        try {
          await this.$store.dispatch('getDispatches');
        } catch(err) {
          this.error = err;
        }
      },
      async editItem1 (item) {
        this.$set(this, 'selectedDispatch', item)
        try {
          let dispatchEdit = await this.$store.dispatch('getDispatchesById', item._id)
          this.editItem = dispatchEdit;
          this.editedItem = dispatchEdit;
          this.dialogEdit = true
        }catch {
          new AppError('Kunne ikke åpne utsendelsen', 'Klarte ikke å avgjøre hvordan utsendelsen skulle åpnes')
        }
      },
      openMap(item){
        this.$set(this, 'selectedDispatch', item)
        this.dialogMap = true
      },
      async previewPDF(item) {
        // Input validation
        if(!item) {
          alert('Forhåndsvisning kan ikke gjøres når utsendelse ikke er valgt');
          return;
        }

        this.$store.dispatch('getPDFPreview', { template: item.template, preview: true })
      },
      hide_alert: function () {
        window.setInterval(() => {
          this.alert_success = false
        }, 3000)    
      }
    },
  }
</script>

<style scoped>
.wrapper {
  box-shadow: 0px 1px 5px 1px #888888;
}
.centerbtn {
  width: 100%;
  text-align:center;
  display: flex;
  justify-content: center;
  align-items: center;
}
.v-alert {
  position: fixed;
  left: 50%;
  bottom: 1rem;
  transform: translate(-50%, -50%);
  margin: 0 auto;
}
.map-wrapper {
  position: relative;
  box-shadow: 0px 1px 5px 1px #888888;   
}
.card {
    width: 100%;
    border-radius: 20px;
    background-color: white;
    min-height: 250px;
    padding: 1rem 1rem;
}
</style>