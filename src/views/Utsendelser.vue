<template>
  <div class="container">
    <h2 class="typography heading-two" style="margin: 2rem;">Utsendelser</h2>
    <v-card>
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
        style="margin: 2rem"
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
            @click="editItem(item)"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            medium
            style="padding-right:0.2rem;"
            @click="openMap(item)"
          >
            mdi-note-search 
          </v-icon>
          <v-icon
            medium
            @click="openLetter(item)"
          >
            mdi-map-search 
          </v-icon>
      </template>
      </v-data-table>
    </v-card>
    <!-- MODALER -->
    <v-dialog
    v-model="dialog"
    width="50%"
    >
    <v-card>
      <v-card-title>
        Sett status
      </v-card-title>
        <v-card-text>
          <v-text-field
            label="Status"
          ></v-text-field>
      </v-card-text>
        <v-card-actions style="display:flex; gap:1rem;">
          <VTFKButton 
                type='secondary' size='small' style="padding-bottom: 1rem;"
                :passedProps="{ onClick: () => viewDocument() }"
                >Lagre
                </VTFKButton>
                <VTFKButton 
                type='secondary' size='small' style="padding-bottom: 1rem;"
                :passedProps="{ onClick: () => viewDocument() }"
                >Avbryt
                </VTFKButton>
        </v-card-actions>
    </v-card>
    </v-dialog>

  </div>
</template>

<script>
import { Button } from '@vtfk/components'

  export default {
    name: 'UtsendelserView',
    components: {
        'VTFKButton': Button,
    },
    data () {
      return {
        search: '',
        dialog: false,
        dialogEdit: false,
        dialogDelete:false,
        loading:false,
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
          ]
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
        this.dialog = true
      },
      openMap(){
        
      },
      openLetter(){
        console.log("Hei")
      }
    },
  }
</script>

<style scoped>


</style>