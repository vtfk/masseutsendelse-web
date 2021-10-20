<template>
  <div class="container">
        <!-- Informasjonstekst -->
        <div style="display: flex; align-items: center; flex-direction: column;">
          <div class="typography heading-two header-title">Masseutsendelse</div>
          <p class="typography paragraph header-description" style="margin-top: 1rem;">
            Ett verktøy utviklet for Samferdesel og mobilitets sektoren.<br/>
            Verktøyet lar deg laste opp en polygon fil, gjøre oppslag i Matrikkelen og varsle alle eiere som befinner seg innenfor polygonet.
          </p>
          <div style="display: flex; flex-direction: row; padding-top: 1rem; gap: 1rem;">
            <div>
              <GuideBtnModal />
            </div>
            <router-link to="/utsendelser" style="text-decoration: none; color: inherit;">
              <VTFKButton>Alle utsendelser</VTFKButton>
            </router-link>
          </div>
        </div>
        <!-- Innhold -->
        <div style="margin-top: 1rem;">
          <div v-if="error" class="error-card">
            <h1>En feil har oppstått</h1>
            <h3 v-if="error.title">{{error.title}}</h3>
            <p v-if="error.message">{{error.message}}</p>
            <!-- <strong>Stack:</strong>
            <p style="text-align: left;">{{error.stack}}</p> -->
            <div style="display: flex; justify-content: center;">
              <VTFKButton style="margin-top: 1rem;" :passedProps="{onClick: () => {reset(true)}}">Start på nytt</VTFKButton>
            </div>
          </div>
          <!-- Upload felt -->
          <div v-else-if="!uploadedFile">
            <UploadField v-on:uploaded="(files) => parseFiles(files)"/>
          </div>
          <!-- Parsing indicator -->
          <div v-else-if="isParsingFile">
            <p class="typography heading-two">Filen bearbeides, vent litt<p/>
            <VTFKSpinner size="xlarge"/>
          </div>
          <div v-else class="center-content">
            <!-- Kart komponent -->
            <Map :coordinates="polygon" :center="mapCenter" :markers="markers"/>
            <!-- Knapp for å hente data fra API -->
            <div v-if="!isAllRequiredMatrikkelInfoRetreived" style="display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-top: 1rem;">
              <!-- Hent informasjon fra matrikkelen -->
              <VTFKButton :passedProps="{ onClick: () => getDataFromMatrikkelAPI() }">Hent matrikkel infromasjon</VTFKButton>
              <!-- Angreknapp -->
              <VTFKButton v-if="!isMatrikkelApproved" :passedProps="{onClick: () => {reset()}}">Angre</VTFKButton>
            </div>
            <div v-else>
              <Loading v-if="statItems.length == 0 && isContactingMatrikkel" title="Kontaker matrikkelen" message="Henter enheter innenfor polygon"/>
              <!-- Cards som viser stats om informasjonen -->
              <StatCards style="margin-top: 1rem" :items="statItems"/>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-top: 1rem;">
                <!-- Angreknapp -->
                <VTFKButton v-if="!isMatrikkelApproved" :passedProps="{onClick: () => {reset()}}">Angre</VTFKButton>
                <!-- Aksept for at matrikkel info ser ok ut -->
                <VTFKCheckbox
                  v-if="dispatch.matrikkel.affectedCount"
                  name="matrikkelOk"
                  label="Matrikkelinformasjonen ser korrekt ut"
                  :passedProps="{ onChange: () => { isMatrikkelApproved = !isMatrikkelApproved; }}"
                />
              </div>
            </div>
            
            <!-- Prosjekt informasjon -->
            <div v-if="isMatrikkelApproved" class="card shadow" style="margin-top: 1rem; width: 100%; display: flex; flex-direction: column; align-items: center;">
              <h1>Masseutsendelse</h1>
              <VTFKSelect
                label="Velg dokument mal"
                :items="templateItems"
                :passedProps="{ onChange: (e) => { onTemplateChange(e)}}"
                style="max-width: 750px; width: 100%;"
                placeholder="Velg mal"
                :selectedItem="selectedTemplate"
                :closeOnSelect="true"
                :isOpen="isTemplateSelectorOpen"
              />
              <VTFKTextField placeholder="Tittel" :value="dispatch.title" :passedProps="{ onChange: (e) => { dispatch.title = e.target.value } }" style="max-width: 750px; width: 100%; margin-top: 1rem;" />
              <VTFKTextField placeholder="Brødtekst" :value="dispatch.body" :passedProps="{ onChange: (e) => { dispatch.body = e.target.value } }" :rows="8" style="max-width: 750px; width: 100%; margin-top: 1rem;"/>
              <VTFKButton style="margin-top: 1rem;" :disabled="!isDispatchFilledInn" :passedProps="{onClick: () => {}}">Se forhåndsvisning</VTFKButton>
              <VTFKCheckbox
                v-if="isAllRequiredMatrikkelInfoRetreived"
                name="dispatchApproved"
                :label="'Følgende informasjon skal sendes ut til ' + dispatch.matrikkel.totalOwners + ' mottakere'"
                :passedProps="{ onChange: () => { isFirstLevelDispatchApproved = !isFirstLevelDispatchApproved; }}"
                style="margin-top: 1rem;"
              />
              <VTFKButton style="margin-top: 1rem;" :disabled="!isFirstLevelDispatchApproved || !isDispatchFilledInn" :passedProps="{onClick: () => { submitMassDispatch(); }}">Send til godkjenning</VTFKButton>
              <VTFKButton style="margin-top: 1rem;" :passedProps="{onClick: () => {reset()}}">Start på nytt</VTFKButton>
            </div>
            <!-- <VDataTable class="shadow" style="margin-top: 1rem; width: 100%;" :headers="tableHeader" :items="parsedItems" :items-per-page="20" :show-expand="true">
              <template v-slot:expanded-item="{ headers, item }">
                <td :colspan="headers.length" style="padding: 1rem 1rem;">
                  <h2>Eierforhold</h2>
                  <VDataTable :headers="eierHeader" :items="item.eiere" :hide-default-footer="true">
                  </VDataTable>
                </td>
              </template>
            </VDataTable> -->
          </div>
        </div>
      </div>
</template>

<script>
  // VTFK komponenter
  import { Button, Spinner, TextField, Select, Checkbox } from '@vtfk/components'

  // Prosjektkomponenter
  import GuideBtnModal from '../components/GuideBtnModal.vue'
  import UploadField from '../components/UploadField.vue'
  import Map from '../components/Map.vue'
  import StatCards from '../components/StatCards.vue'
  import Loading from '../components/Loadig.vue'

  // Import libraries
  import MatrikkelProxyClient from '../lib/matrikkelProxyClient'
  import DxfParser from 'dxf-parser'
  import proj4 from 'proj4';

  // Error klasse
  class AppError extends Error {
    constructor(title, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.title = title;
    }
  }

  export default {
    name: 'HomeView',
    components: {
    'VTFKButton': Button,
    'VTFKSpinner': Spinner,
    'VTFKTextField': TextField,
    'VTFKSelect': Select,
    'VTFKCheckbox': Checkbox,
    GuideBtnModal,
    UploadField,
    Map,
    StatCards,
    Loading
  },
  data() {
    return {
      dispatch: {
        title: '',
        body: '',
        template: undefined,
        matrikkel: {
          affectedCount: null,
          area: null,
          totalOwners: null,
          privateOwners: null,
          businessOwners: null
        },
        polygon: {
          coordinateSystem: undefined,
          points: []
        }
      },
      uploadedFile: undefined,
      isParsingFile: false,
      isMatrikkelApproved: false,
      isFirstLevelDispatchApproved: false,
      isShowModal: false,
      hasLoadedFile: false,
      isContactingMatrikkel: false,
      mapCenter: [],
      markers: [],
      polygon: [],
      statItems: [],
      parsedItems: [],
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
      tableHeader: [
        {
          text: 'Bruksnavn',
          value: 'bruksnavn'
        },
        {
          text: 'Type',
          value: 'type'
        },
        {
          text: 'Gårds #',
          value: 'gardsnummer'
        },
        {
          text: 'Bruks #',
          value: 'bruksnummer'
        },
        {
          text: 'Feste #',
          value: 'festenummer'
        },
        {
          text: 'Kommune ID',
          value: 'kommuneId'
        },
        {
          text: 'Areal',
          value: 'oppgittAreal'
        }
      ],
      eierHeader: [
        {
          text: 'Dato fra',
          value: 'datoFra'
        },
        {
          text: 'Type',
          value: 'type'
        },
        {
          text: 'Eier id',
          value: 'eierId'
        },
        {
          text: 'EierforholdKode',
          value: 'eierforholdKode'
        },
        {
          text: 'kommuneId',
          value: 'kommuneId'
        },
        {
          text: 'Andelsnummer',
          value: 'andelsnummer'
        },
        {
          text: 'Andel teller',
          value: 'andel.teller'
        },
        {
          text: 'Andel nevner',
          value: 'andel.nevner'
        },
      ],
      error: undefined,
    }
  },
  computed: {
    isAllRequiredMatrikkelInfoRetreived() {
      const m = this.dispatch.matrikkel;
      if(m.affectedCount !== null && m.area !== null && m.totalOwners !== null) {
        return true;
      }

      return false;
    },
    isDispatchFilledInn() {
      if(this.dispatch.title && this.dispatch.body && this.dispatch.template) { return true; }
      return false;
    }
  },
  methods: {
    setError(error) {
      this.error = error;
    },
    reset(force = false) {
      if(force === false) {
        if(!confirm('Er du helt sikker på at du vil starte på nytt?')) {
          return;
        }
      }

      // Action states
      this.state = 'initial';
      this.isShowModal = false;
      this.hasLoadedFile = false;
      this.isParsingFile = false;
      this.isContactingMatrikkel = false;

      // Data
      this.uploadedFile = undefined;
      this.markers = [];
      this.mapCenter = [];
      this.polygon = [];
      this.statItems = [];
      this.error = undefined;
    },
    async getDataFromMatrikkelAPI(polygon) {
      if(!polygon) {
        polygon = [
          {
              x: 9.061226825863429,
              y: 59.417888839303345,
              z: 0
          },
          {
              x: 9.06059789499838,
              y: 59.41877340387384,
              z: 0
          },
          {
              x: 9.062418554835972,
              y: 59.41876773278693,
              z: 0
          },
          {
              x: 9.062615483212653,
              y: 59.418047496800966,
              z: 0
          },
          {
              x: 9.061226825863429,
              y: 59.417888839303345,
              z: 0
          }
        ]
      }
      this.isContactingMatrikkel = true;
      let matrikkelClient = new MatrikkelProxyClient();

      // Hent ut alle MatrikkelEnhet-IDer innenfor polygonet
      let matrikkelEnhetIds = await matrikkelClient.getMatrikkelEnheter(polygon, { query: { flatten: true, metadata: false } });
      if(!matrikkelEnhetIds && matrikkelEnhetIds.length) { this.error = 'Kunne ikke laste inn noen matrikkelenheter innenfor dette polygonet. '; return; }

      // Lag ett request for å kontakte store-service for informasjon om enhetene
      let matrikkelEnhetItems = [];
      matrikkelEnhetIds.forEach((item) => {
        matrikkelEnhetItems.push({
          type: 'MatrikkelenhetId',
          namespace: 'http://matrikkel.statkart.no/matrikkelapi/wsapi/v1/domain/matrikkelenhet',
          value: item
        })
      })

      this.statItems.push({ text: 'Enheter', value: matrikkelEnhetItems.length })

      this.dispatch.matrikkel.affectedCount = matrikkelEnhetItems.length;

      // Hent ut data for alle matrikkel enhetene
      let matrikkelEnheter = await matrikkelClient.getStoreItems(matrikkelEnhetItems, { query: { flatten: true, metadata: false } });
      if(!matrikkelEnheter && matrikkelEnheter.length) { this.error = 'Kunne ikke laste inn noen matrikkelenheter innenfor dette polygonet. '; return; }
      
      // Parse the matrikkelenhet data
      let parsedMatrikkelEnheter = this.parseMatrikkelEnheter(matrikkelEnheter);

      // Hent ut alle eiere fra dataene
      let eiere = [];
      parsedMatrikkelEnheter.forEach((enhet) => {
        enhet.eiere.forEach((eier) => {
          if(!eiere.find((e) => e.eierId === eier.eierId && e.type === eier.type)) {
            eiere.push(eier);
          }
        })
      })

      // Legg ut ett stat-card for hver av de unike eierne
      this.statItems.push({ text: 'Unike eiere', value: eiere.length })

      let antallJuridiskeEiere = eiere.filter((e) => e.type.toLowerCase().includes('juridisk'));
      this.statItems.push({ text: 'Juridiske eiere', value: antallJuridiskeEiere.length })
      this.statItems.push({ text: 'Private eiere', value: eiere.length - antallJuridiskeEiere.length })

      this.dispatch.matrikkel.privateOwners = eiere.length - antallJuridiskeEiere.length;
      this.dispatch.matrikkel.businessOwners = antallJuridiskeEiere.length;
      this.dispatch.matrikkel.totalOwners = eiere.length;

      // Kontakt matrikkelen og hent ut alle eiere
      let ownerRequest = [];
      eiere.forEach((eier) => {
        ownerRequest.push({
          type: 'PersonId',
          namespace: 'http://matrikkel.statkart.no/matrikkelapi/wsapi/v1/domain/person',
          value: eier.eierId
        })
      })

      const matrikkelEiere = await matrikkelClient.getStoreItems(ownerRequest, { query: { flatten: true, metadata: false } });

      // Match eiere og matrikkelEiere
      if(ownerRequest.length !== matrikkelEiere.length) {
        throw new AppError('Mismatch i mellom antall forespurte eiere og motatte eiere', 'Vi spurte matrikkel APIet om informasjon om ' + ownerRequest.length + ' eiere, men fikk svar på ' + matrikkelEiere.length + ' eiere.')
      }

      let ikkeMatchetEiere = [];  // array som holder på antallet eiere som ikke er matchet om noen
      eiere.forEach((eierforhold) => {
        let match = undefined;
        console.log(eierforhold);
        
        matrikkelEiere.forEach((eier) => {
          let type = this.getItemType(eier);
          let id = this.getItemValue(eier.id);

          if(id === eierforhold.eierId) { match = eier; }
          else { return; }

          eier.type = type;
          eierforhold.eier = eier;
        })

        if(!match) {
          ikkeMatchetEiere.push(eierforhold);
        }
      })

      if(ikkeMatchetEiere.length > 0) {
        throw new AppError('Klarte ikke finne alle eiere', 'Vi klarte ikke å finne ' + ikkeMatchetEiere.length + ' eiere')
      }

      console.log(eiere);

      this.parsedItems = parsedMatrikkelEnheter;


      this.isContactingMatrikkel = false;
    },
    async readFile(file) {
      // Always return a Promise
      return new Promise((resolve, reject) => {
        let content = '';
        const reader = new FileReader();
        // Wait till complete
        reader.onloadend = function(e) {
          content = e.target.result;
          // const result = content.split(/\r\n|\n/);
          resolve(content);
        };
        // Make sure to handle error states
        reader.onerror = function(e) {
          reject(e);
        };
        reader.readAsText(file);
      });
    },
    async parseFiles(files) {
      try {
        if(!files || files.length == 0) {
          throw new AppError('Filopplastings feil', 'Det ble påkallet en filopplasting, men ingen fil ble lastet opp')
        }
        let dxf_files = files.filter((f) => f.name.toLowerCase().endsWith('.dxf'));
        if(!dxf_files || dxf_files.length === 0) {
          throw new AppError('Feil filtype', 'Filen som ble lastet opp er av feil filtype. Filen må være av typen .dxf')
        }
        
        this.hasLoadedFile = true;
        this.isParsingFile = true;

        let file = dxf_files[0];
        this.uploadedFile = file;
        let fileData = await this.readFile(file.data);

        if(!fileData || fileData.length === 0) { throw new AppError('Filen er tom', 'Den opplastede .dxf-filen inneholder ingen data') }

        var parser = new DxfParser();
        let parsed = parser.parseSync(fileData);

        if(!parsed.entities) { throw new AppError('Fil inneholder ingen former', 'Filen inneholder ingen former') }

        let polygons = parsed.entities.filter((i => i.type === 'LWPOLYLINE'));
        if(polygons.length == 0) { throw new AppError('Fil inneholder ingen polygoner', 'Filen inneholder ingen polygoner') }
        else if(polygons.length > 1) { throw new AppError('Fil inneholder ingen polygoner', ('Filen må kun inneholde ett polygon, men det inne holder ' + polygons.length))  }

        const polygon = polygons[0];
        if(!polygon || !polygon.vertices || polygon.vertices.length === 0) {
          throw new AppError('Polygonet mangler linjesegmenter', ('Polygonet i filen inneholder ingen linjesegmenter'))
        }
 
        let vertices = polygons[0].vertices;

        // Define the coordinate translations
        proj4.defs([
          [
            'EPSG:4326',
            '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
          [
            'EPSG:25832',
            '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs'
          ]
        ]);

        let lowX = vertices[0].x;
        let highX = vertices[0].x;
        let lowY = vertices[0].y;
        let highY = vertices[0].y;
        
        let northPoint = undefined;
        let westPoint = undefined;
        let eastPoint = undefined;
        let southPoint = undefined;

        let transformedVertices = [];
        // let firstLatitude = vertices[0].y;
        vertices.forEach((vertice) => {
          // Make a copy of the vertice to not modify the source object
          let vCopy = JSON.parse(JSON.stringify(vertice))
          // Transform the coordinates
          let transformed = proj4('EPSG:25832', 'EPSG:4326', vCopy);
          // Find the outermost points, used for calculating the center of the polygon
          if(vertice.x > highX) { westPoint = vertice; highX = vertice.x; }
          else if(vertice.x < lowX) { eastPoint = vertice; lowX = vertice.x; }
          if(vertice.y > highY) { northPoint = vertice; highY = vertice.y; }
          else if(vertice.y < lowY) { southPoint = vertice; lowY = vertice.y }
          // Add the transformed points to the transformed array
          transformedVertices.push([transformed.y, transformed.x]);
        })

        // Calculate midpoint
        let transformedCenter = proj4('EPSG:25832', 'EPSG:4326', {x: (lowX + highX) / 2, y: (lowY + highY) / 2});

        // Calculate the coordinates for the outmost points
        /* eslint-disable */
        let translatedNorth = proj4('EPSG:25832', 'EPSG:4326', {x: northPoint.x , y: northPoint.y});
        let translatedWest = proj4('EPSG:25832', 'EPSG:4326', {x: westPoint.x , y: westPoint.y});
        let translatedEast = proj4('EPSG:25832', 'EPSG:4326', {x: eastPoint.x , y: eastPoint.y});
        let translatedSouth = proj4('EPSG:25832', 'EPSG:4326', {x: southPoint.x , y: southPoint.y});
        /* eslint-enable */

        // Kalkuler polygonets areal
        this.dispatch.matrikkel.area = 100;

        // Set the center of the map
        this.mapCenter = [transformedCenter.y, transformedCenter.x];

        // Add markers for the outermost points
        
        this.markers.push([transformedCenter.y, transformedCenter.x]);
        // this.markers.push([translatedNorth.y, translatedNorth.x]);
        // this.markers.push([translatedWest.y, translatedWest.x]);
        // this.markers.push([translatedEast.y, translatedEast.x]);
        // this.markers.push([translatedSouth.y, translatedSouth.x]);

        // Set the polygon the be the transformed vertices
        this.polygon = transformedVertices;

        // Set that the file has been parsed
        this.isParsingFile = false;
      } catch (err) {
        this.setError(err);
        console.error(err.stack);
      }
    },
    getItemType(item) {
      if(!item) { return 'unresolved'; }

      let type = 'unresolved';
      if(item && item.$ && item.$['xsi:type']) { type = item.$['xsi:type']; }
      if(type.includes(':')) { type = type.split(':')[1]; }

      return type;
    },
    getItemValue(item) {
      if(!item) { return; }

      if(Object.keys(item).length === 1) {
        return item[Object.keys(item)[0]]
      }
      else if(Object.keys(item).length === 2 && item.$) {
        let key = Object.keys(item).find((k) => k !== '$');
        if(key) { return item[key]; }
      }
      
      return item;
    },
    parseMatrikkelEnheter(Enheter) {
      if(!Enheter) { return; }
      if(!Array.isArray(Enheter)) { Enheter = [Enheter]; }

      let parsed = [];
      let counter = 0;
      console.log('Enhter til parsing: ' + Enheter.length)
      Enheter.forEach((enhet) => {
        counter++;
        let item = {}
        console.log('Parsing: ' + counter);
        let type = this.getItemType(enhet);

        let id = 'unresolved';
        if(enhet && enhet.id) {
          if(enhet.id.value) { id = enhet.id.value; }
          else { id = enhet.id; }
        }

        item = {
          bruksnavn: enhet.bruksnavn,
          oppgittAreal: enhet.historiskOppgittAreal || 0,
          id: id,
          type: type
        }

        // Hent ut matrikkel informasjon
        if(enhet.matrikkelnummer) {
          item.gardsnummer = this.getItemValue(enhet.matrikkelnummer.gardsnummer);
          item.bruksnummer = this.getItemValue(enhet.matrikkelnummer.bruksnummer);
          item.festenummer = this.getItemValue(enhet.matrikkelnummer.festenummer);
          item.kommuneId = this.getItemValue(enhet.matrikkelnummer.kommuneId);
        }

        // Hent ut eierinformasjon
        if(enhet.eierforhold) {
          if(enhet.eierforhold.item) { enhet.eierforhold = enhet.eierforhold.item }
          if(!Array.isArray(enhet.eierforhold)) { enhet.eierforhold = [enhet.eierforhold]; }

          let eiere = [];
          enhet.eierforhold.forEach((eierforhold) => {
            eiere.push({
              datoFra: this.getItemValue(eierforhold.datoFra),
              type: this.getItemType(eierforhold),
              eierId: this.getItemValue(eierforhold.eierId),
              eierforholdKode: this.getItemValue(eierforhold.eierforholdKodeId),
              kommuneId: this.getItemValue(eierforhold.kommuneId),
              andelsnummer: this.getItemValue(eierforhold.andelsnummer),
              andel: this.getItemValue(eierforhold.andel),
            })
          })
          item.eiere = eiere;
        }

        parsed.push(item);
      })
      return parsed;
    },
    submitMassDispatch() {
      if(confirm('Er du helt sikker på at du vil sende inn?')) {
        console.log('Vil sendes inn');
      }
    },
    onTemplateChange(e) {
      this.selectedTemplate = e;
      this.dispatch.template = e.value;
    },
    onTextChange(e) {
      console.log(e);
    },
    updateProject(key, value) {
      console.log('Setting "' + key + '" to "' + value + '"');
      this.$set(this.project, key, value)
    }
  },
  }
</script>

<style scoped>

  .card {
    width: 100%;
    border-radius: 20px;
    background-color: white;
    min-height: 250px;
    padding: 1rem 1rem;
  }

</style>