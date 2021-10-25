<template>
  <div class="container">
    <h2 class="typography heading-two" style="margin: 2rem;">Utsendelser</h2>
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
        :loading="loading"
        loading-text="Laster data fra databasen "
      >
        <template v-slot:[`item.status`]="{ item }">
          <v-chip
            :color="getColor(item.status)"
            dark
          >
            {{ item.status }}
          </v-chip>
        </template>
        <template v-slot:[`item.handlinger`]="{ item }">
          <v-icon
            medium
            style="padding-right:0.2rem;"
            tag='test'
            @click="editItem(item)"
            v-on:click="test"
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
    v-model="dialogEdit"
    width="50%"
    >
    <v-card>
      <v-card-title>
        Sett status
      </v-card-title>
        <v-card-text>
          <v-select
          v-model="select"
          :hint="`Prosjektets status vil bli satt til ${select.status_valg}`"
          :items="items"
          item-text="status_valg"
          item-value="status_value"
          label="Sett status for prosjektet"
          :menu-props="{ bottom: true, offsetY: true }"
          chips
          persistent-hint
          hide-selected
          outlined
          rounded
          return-object
          single-line
        >
          <template #selection="{item}">
          <v-chip
           :color="getColor(item.status_value)"
          >
            {{ item.status_value }}
          </v-chip>
        </template>
        </v-select>
        </v-card-text>
        <v-card-actions style="display:flex; gap:1rem;" class="centerbtn">
          <VTFKButton 
            type='secondary' size='small' style="padding-bottom: 1rem;"
            :passedProps="{ onClick: () => [saveEdit(), clear()] }"
            v-on:click="clear"
            >Lagre
          </VTFKButton>
          <VTFKButton 
            type='secondary' size='small' style="padding-bottom: 1rem;"
            :passedProps="{ onClick: () => [dialogEdit = false, clear()] }"
            >Avbryt
          </VTFKButton>
        </v-card-actions>
    </v-card>
    </v-dialog>
    <!-- Map dialog -->
    <v-dialog
    v-model="dialogMap"
    width="50%"
    >
    <v-card>
      <v-card-title>
        Kart
      </v-card-title>
        <v-img class="map-wrapper">
          <Map/>
        </v-img>
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
    v-model="dialogDoc"
    width="50%"
    >
    <v-card>
      <v-card-title>
        Dokumenter
      </v-card-title>
        <v-card-text>
          Noe greier her
        </v-card-text>
        <v-card-actions style="display:flex; gap:1rem;" class="centerbtn">
          <VTFKButton 
            type='secondary' size='small' style="padding-bottom: 1rem;"
            :passedProps="{ onClick: () => [dialogDoc = false] }"
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
//VTFK
import { Button } from '@vtfk/components'

//Prosjekt
import Map from '../components/Map.vue';

  export default {
    name: 'UtsendelserView',
    components: {
        'VTFKButton': Button,
        Map,
    },
    data () {
      return {
        search: '',
        dialogDoc: false,
        dialogEdit: false,
        dialogMap:false,
        loading:false,
        alert_success: false,
        headers: [
          {
            text: 'Prosjekt',
            align: 'start',
            sortable: true,
            value: 'navn',
          },
          {text: 'Prosjekt Nr', value: 'prosjektnr'},
          {text: 'Dato', value: 'dato'},
          {text: 'Status', value: 'status'},
          {text: 'Oppretshaver', value: 'oppretshaver'},
          {text: 'Behandlet av', value: 'behandletav'},
          {text: 'Filnavn', value: 'filnavn'},
          {text: 'Handlinger', value: 'handlinger', sortable:false}
        ],
        prosjekter: [
          {
            navn:'Ulefoss',
            prosjektnr:'1',
            dato:'01.02.2021',
            status:'Godkjent',
            oppretshaver:'Per',
            behandletav: 'Lars',
            filnavn:'Ulefoss Polygon.dfx',
          },
          {
            navn:'Gvarv',
            prosjektnr:'2',
            dato:'02.03.2021',
            status:'Godkjent',
            oppretshaver:'Per',
            behandletav: 'Lars',
            filnavn:'Gvarv Polygon.dfx',
          },
          {
            navn:'Gvarv',
            prosjektnr:'2',
            dato:'01.03.2021',
            status:'Ikke Godkjent',
            oppretshaver:'Per',
            behandletav: 'Lars',
            filnavn:'Gvarv Polygon.dfx',
          },
          {
            navn:'Bø i Telemark',
            prosjektnr:'3',
            dato:'01.01.2020',
            status:'Sendt',
            oppretshaver:'Per',
            behandletav: 'Lars',
            filnavn:'Bø Polygon.dfx',
          },
          {
            navn:'Skien',
            prosjektnr:'4',
            dato:'05.02.2021',
            status:'Til Behandling',
            oppretshaver:'Lars',
            behandletav: 'Per',
            filnavn:'Skien Polygon.dfx',
          },
        ],
        select: {status_valg: '', status_value: ''},
        items: [
          { status_valg: 'Godkjent', status_value: 'Godkjent'},
          { status_valg: 'Ikke Godkjent', status_value: 'Ikke Godkjent'},
          { status_valg: 'Til Behandling', status_value: 'Til Behandling'},
          { status_valg: 'Sendt', status_value: 'Sendt'},
        ],
        fetchStatus: '',
      }
    },
    methods: {
      getColor (status) {
        if (status == "Godkjent") return '#91B99F'
        else if (status == "Ikke Godkjent") return '#E7827E'
        else if (status == "Sendt") return '#D0C788'
        else if (status == "Til Behandling") return '#E0C38B'
        else return '#FFFFF'
      },
      editItem (item) {
        this.editedIndex = this.prosjekter.indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialogEdit = true
        this.fetchStatus = `${this.editedItem.status}`
        this.select = this.fetchStatus
        // console.log(this.editedItem.status)
        // console.log(this.editedIndex)
        // console.log(this.editedItem)
      },
      openMap(item){
        // TODO
        // En funksjon som åpner kartet til polygonet til det valgte prosjektet
        // Henter prosjekt nr fra table, sender til DB får tilbake kart info og passer dene til kartet.
        this.editedIndex = this.prosjekter.indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialogMap = true
        this.fetchProsjektNr = `${this.editedItem.prosjektnr}`
        console.log(this.fetchProsjektNr)
      },
      openDoc(item){
        //TODO
        // Henter prosjekt nr fra table, sender dette til DB og fær tilbake brevet/dokumentene som er sendt. 
        this.editedIndex = this.prosjekter.indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialogDoc = true
        this.fetchProsjektNr = `${this.editedItem.prosjektnr}`
        console.log(this.fetchProsjektNr)
      },
      saveEdit() {
        this.dialogEdit = false
        this.alert_success = true
        this.hide_alert();
        // console.log(this.editedItem.status)
        // this.editedItem.status = this.select.status_value
        // console.log(this.editedItem.status)
        // console.log(this.editedItem)
        // console.log(this.select.status_value)
      },
      selectedItem() {
        return this.editedItem.status
      },
      clear(){
          this.select = this.clear
      },
      test(){
        this.editItem.status = this.select
        // console.log(this.editedItem.status)
        // console.log(this.select.status_value)
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
    box-shadow: 0px 1px 5px 1px #888888;
}
</style>