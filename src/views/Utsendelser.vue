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
        class="elevation-1"
        style="margin: 2rem"
        :search="search"
        loading
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
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
  export default {
    name: 'UtsendelserView',
    data () {
      return {
        search: '',
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
          {text: 'Filnavn', value: 'filnavn'},
        ],
          prosjekter: [
            {
              navn:'Ulefoss',
              prosjektnr:'1',
              dato:'01.02.2021',
              status:'Godkjent',
              oppretshaver:'Per',
              filnavn:'Ulefoss Polygon.dfx',
            },
            {
              navn:'Gvarv',
              prosjektnr:'2',
              dato:'02.03.2021',
              status:'Godkjent',
              oppretshaver:'Per',
              filnavn:'Gvarv Polygon.dfx',
            },
            {
              navn:'Gvarv',
              prosjektnr:'2',
              dato:'01.03.2021',
              status:'Ikke Godkjent',
              oppretshaver:'Per',
              filnavn:'Gvarv Polygon.dfx',
            },
            {
              navn:'Bø i Telemark',
              prosjektnr:'3',
              dato:'01.01.2020',
              status:'Sendt',
              oppretshaver:'Per',
              filnavn:'Bø Polygon.dfx',
            },
            {
              navn:'Skien',
              prosjektnr:'4',
              dato:'05.02.2021',
              status:'Til Behandling',
              oppretshaver:'Lars',
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
    },
  }
</script>

<style scoped>


</style>