<template>
  <div class="container">
    <h2 class="typography heading-two" style="margin: 2rem;">Utsendelser</h2>
    <Error v-if="error" :error="error"/>
    <Loading v-else-if="dispatches.length === 0 || isLoading" title="Laster utsendelser" message="Dette kan ta noen sekunder" />
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
          :items="prosjekter"
          :items-per-page="5"
          fixed-header
          class="elevation-1"
          style="margin: 2rem;"
          :search="search"
          :loading="isLoading"
          loading-text="Laster data fra databasen "
        >
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
              @click="openDoc(item)"
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
      <!-- MODALER/DIALOGER -->
      <!-- Edit dialog -->
      <v-dialog
      v-if="dialogEdit"
      v-model="dialogEdit"
      width="80%"
      >
      <v-card>
        <v-card-title>
         Rediger 
        </v-card-title>
          <v-card-text>
            <DispatchEditor :dispatchObject="editItem"/>
          </v-card-text>
          <v-card-actions style="display:flex; gap:1rem;" class="centerbtn">
            <VTFKButton 
              type='secondary' size='small' style="padding-bottom: 1rem;"
              :passedProps="{ onClick: () => [saveEdit()] }"
              >Lagre
            </VTFKButton>
            <VTFKButton 
              type='secondary' size='small' style="padding-bottom: 1rem;"
              :passedProps="{ onClick: () => [dialogEdit = false] }"
              >Avbryt
            </VTFKButton>
          </v-card-actions>
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
      <!-- Doc dialog -->
      <v-dialog
      v-if="dialogDoc"
      v-model="dialogDoc"
      width="80%"
      >
      <v-card>
        <v-card-title>
          Dokumenter
        </v-card-title>
           <dispatch-editor
          :dispatchObject="openDoc"
          >
          </dispatch-editor>
          <v-card-actions style="display:flex; gap:1rem;" class="centerbtn">
            <VTFKButton 
              type='secondary' size='small' style="padding-bottom: 1rem;"
              :passedProps="{ onClick: () => [dialogDoc = false] }"
              >Lukk
            </VTFKButton>
          </v-card-actions>
      </v-card>
      </v-dialog>
    </div>
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
// Dependencies
import axios from 'axios'
import AppError from '../lib/AppError';


// VTFK komponenter
import { Button } from '@vtfk/components'

// Prosjekt komponenter
import Loading from '../components/Loading.vue';
import Error from '../components/Error.vue';
import Map from '../components/Map.vue';
import DispatchEditor from '../components/DispatchEditor.vue';

  export default {
    name: 'UtsendelserView',
    components: {
        'VTFKButton': Button,
        Loading,
        Error,
        Map,
        DispatchEditor,
    },
    data () {
      return {
        isLoading: false,
        error: undefined,
        dispatches: [],
        search: '',
        dialogDoc: false,
        dialogEdit: false,
        dialogMap:false,
        loading:false,
        selectedDispatch: undefined,
        alert_success: false,
        isTemplateSelectorOpen: true,
        selectedTemplate: undefined,
        templateItems: [
          {
            label: 'Omregulering',
            value: 'omregulering'
          },
          {
            label: 'Bygge vei',
            value: 'vei'
          }
        ],
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        headers: [
          {
            text: 'Prosjekt',
            align: 'start',
            sortable: true,
            value: 'title',
          },
          {text: 'Prosjekt Nr', value: 'nummer'},
          {text: 'Dato', value: 'createdDate'},
          {text: 'Status', value: 'status'},
          {text: 'Oppretshaver', value: 'createdBy'},
          {text: 'Behandlet av', value: 'modifiedBy'},
          {text: 'Filnavn', value: 'polygon.filename'},
          {text: 'Handlinger', value: 'handlinger', sortable:false}
        ],
        prosjekter: [],
        select: {status_valg: '', status_value: ''},
        items: [
          { status_valg: 'Godkjent', status_value: 'approved'},
          { status_valg: 'Ikke Godkjent', status_value: 'not approved'},
          { status_valg: 'Til Behandling', status_value: 'inprogress'},
          { status_valg: 'Fullført', status_value: 'completed'},
        ],
        fetchStatus: '',
      }
    },
    async mounted() {
      // Hent alle dispatches fra mongoDB
      this.loadDataBase()
    },
    computed: {
      isAllRequiredMatrikkelInfoRetreived() {
        const m = this.selectedDispatch.stats;
        if(m.affectedCount !== null && m.area !== null && m.totalOwners !== null) {
          return true;
        }
        return false;
      },
      isDispatchFilledInn() {
        if(this.selectedDispatch.title && this.selectedDispatch.body && this.selectedDispatch.template) { return true; }
        return false;
      },
      mode() {
        if(!this.selectedDispatch || this.selectedDispatch._id === undefined) { return 'new'; }
        return 'edit';
      },
      isReadOnly() {
        if(this.selectedDispatch && (this.selectedDispatch.status === 'inprogress' || this.selectedDispatch.status === 'completed')) { return true; }
        return false;
      }
    },
    methods: {
      getColor (status) {
        if (status == "approved") return '#D0C788'
        else if (status == "not approved") return '#E7827E'
        else if (status == "completed") return '#91B99F'
        else if (status == "inprogress") return '#E0C38B'
        else return '#FFFFF'
      },
      translateStatus (status) {
        if (status == "completed") return "Fullført"
        else if (status == "inprogress") return "Til Behandling"
        else if (status == "approved") return "Godkjent"
        else if (status == "not approved") return "Ikke Godkjent"
      },
      async loadDataBase() {
          this.isLoading = true
          const request = {
          url: 'https://test-func-masseutsendelse.azurewebsites.net/api/getdispatches?',
          method: 'GET',
        }

        try {
          const response = await axios.request(request);

          if(!response || !response.data) {
            throw new AppError('Ingen respons mottatt', 'Utsendelses APIet rapporterte ingen data');
          }

          if(!Array.isArray(response.data) || response.data.length <= 0) {
            throw new AppError('Manglende data', 'Utsendelses APIet svarte, men sendte ingen data');
          }
          this.dispatches = response.data
          this.prosjekter = JSON.parse(JSON.stringify(this.dispatches))

        } catch (err) {
          
          this.error = err;
        }
        this.isLoading = false
      },
      editItem1 (item) {
        this.$set(this, 'selectedDispatch', item)
        this.editItem = item
        this.dialogEdit = true
      },
      openMap(item){
        this.$set(this, 'selectedDispatch', item)
        this.dialogMap = true
      },
      openDoc(item){
        this.dialogDoc = true
        this.openDoc = item
      },
      async saveEdit() {
        this.dialogEdit = false
        this.prosjekter = []
        // TODO må også ta med hvem den er endret av, må gjøre det når vi har fått på plass autentisering. 
        let id = this.selectedDispatch._id
        let status = this.selectedDispatch.status
        let title = this.selectedDispatch.title
        let body = this.selectedDispatch.body

        console.log(id, status, title, body)
        this.isLoading = true
        await axios({
          method: 'put',
          url: 'https://test-func-masseutsendelse.azurewebsites.net/api/editdispatches/'+ id +'?code=SejmUBQQsdqaduLS0mIBR3MFluZTGdyvxCVkZJibQ6J/bMPaAE4ZqA==',
          data: {
            status: `${status}`,
            title: `${title}`,
            body: `${body}`
          }
        });
        console.log(this.url)
        // console.log(status)
        // console.log(id)
        // console.log(this.url)
        await this.loadDataBase()
        this.alert_success = true
        this.hide_alert();
      },
      selectedItem() {
        return this.editedItem.status
      },
      clear(){
          this.select = this.clear
      },
      titleCase(str) {
        // Setter alle forbokstaver til uppercase
        var splitStr = str.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
        }
        return splitStr.join(' '); 
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