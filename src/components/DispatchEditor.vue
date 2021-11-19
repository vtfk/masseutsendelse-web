<template>
  <div style="margin-top: 1rem;">
    <!-- Feilmelding -->
    <ErrorField v-if="error" :error="error" v-on:resetClicked="reset(true)" />
    <!-- Loaders -->
    <Loading v-else-if="isLoadingTemplates" title="Laster inn maler" />
    <!-- Fil opplasting -->
    <div v-else-if="!dispatch || dispatch.geopolygon.vertices.length === 0">
      <UploadField v-on:uploaded="(files) => parseFiles(files)"/>
    </div>
    <div v-else-if="isParsingFile">
      <p class="typography heading-two">Filen bearbeides, vent litt<p/>
      <VTFKSpinner size="xlarge"/>
    </div>
    <!-- Kart og matrikkel -->
    <div v-else class="center-content">
      <Map style="max-width: 750px" :coordinates="dispatch.geopolygon.vertices" :center="dispatch.geopolygon.extremes.center" :markers="[dispatch.geopolygon.extremes.center]"/>  
      <div v-if="!isAllRequiredMatrikkelInfoRetreived && !isContactingMatrikkel" class="centeredColumn" style="margin-top: 1rem;">
        <VTFKButton :passedProps="{ onClick: () => getDataFromMatrikkelAPI() }">Hent matrikkel infromasjon</VTFKButton>
        <VTFKButton v-if="!isMatrikkelApproved" :passedProps="{onClick: () => {reset()}}">Angre</VTFKButton>
      </div>
      <div v-else-if="isContactingMatrikkel" class="shadow" style="margin-top: 1rem; padding: 1rem 1rem; border-radius: 20px; background-color: #CFEBF2;">
        <Loading title="Kontaker matrikkelen" message="Henter enheter innenfor polygon"/>
      </div>
      <div v-else class="centeredColumn" style="margin-top: 1rem;">
        <!-- Cards som viser stats om informasjonen -->
        <StatCards :items="statItems"/>
        <!-- Matrikkel table -->
        <MatrikkelTable :items="dispatch.matrikkelEnheter" item-key="bruksnavn" />
        <div v-if="mode === 'new'" class="centeredColumn">
          <!-- Angreknapp -->
          <VTFKButton v-if="!isMatrikkelApproved" :passedProps="{onClick: () => {reset()}}">Angre</VTFKButton>
          <!-- Aksept for at matrikkel info ser ok ut -->
          <v-checkbox v-if="dispatch.stats.affectedCount" v-model="isMatrikkelApproved" :disabled="isMatrikkelApproved" label="Matrikkelinformasjonen ser korrekt ut"/>
        </div>
      </div>
      <!-- Prosjekt informasjon -->
      <div v-if="isMatrikkelApproved || mode === 'edit'" class="card shadow centeredColumn" style="margin-top: 1rem;">
        <h1>Masseutsendelse</h1>
        <DispatchStatusSelect v-if="mode === 'edit'" v-model="dispatch.status"/>
        <!-- En input for prosjekt navn, en for prosjekt nr -->
        <VTextField 
          :value="dispatch.title"
          placeholder="Angi et prosjektnavn"
          hint="Angi et prosjektnavn"
          label="Prosjekt navn"
          :required="true"
          @change="(title) => onTitleChange(title)" 
          style="max-width: 750px; width: 100%;"
        />
         <VTextField 
          :value="dispatch.prosjektnr"
          placeholder="Angi et nummer"
          hint="Angi et nummer"
          label="Prosjekt nummer"
          :required="true"
          @change="(prosjektnr) => onProsjektNrChange(prosjektnr)" 
          style="max-width: 750px; width: 100%;"
        />
        <VSelect
          label="Velg mal"
          placeholder="Velg mal"
          :value="dispatch.template"
          :items="availableTemplates"
          item-text="name"
          item-value="_id"
          return-object
          :disabled="isReadOnly"
          @change="(e) => onTemplateChanged(e)" 
          style="max-width: 750px; width: 100%;"
        />
        <!-- Kode om @change til dispatch.templateID. Kode om mocken og koden -->
        <div v-if="selectedTemplateSchema" style="max-width: 750px; width: 100%;">
          <h2>Flettefelter</h2>
          <SchemaFields
            v-if="selectedTemplateSchema"
            v-model="dispatch.templateData"
            :schema="selectedTemplateSchema"
            :disabled="isReadOnly"
            @changed="$forceUpdate()"
          />
        </div>
        <VTFKButton
          class="mt-1"
          :disabled="!isDispatchFilledInn"
          :passedProps="{onClick: () => { previewPDF() }}">Se forhåndsvisning
        </VTFKButton>
        <div v-if="mode === 'new'" class="centeredColumn">
          <VTFKCheckbox
            v-if="isAllRequiredMatrikkelInfoRetreived"
            value="false"
            class="mt-1"
            name="dispatchApproved"
            :label="'Følgende informasjon skal sendes ut til ' + dispatch.stats.totalOwners + ' mottakere'"
            :passedProps="{ onChange: () => { isFirstLevelDispatchApproved = !isFirstLevelDispatchApproved; }}"
          />
          <VTFKButton style="margin-top: 1rem;" :disabled="!isFirstLevelDispatchApproved || !isRequiredTemplateDataFilledIn" :passedProps="{onClick: () => { submitMassDispatch(); }}">Send til godkjenning</VTFKButton>
          <VTFKButton style="margin-top: 1rem;" :passedProps="{onClick: () => {reset()}}">Start på nytt</VTFKButton>
        </div>
      </div>
    </div>
    <!-- Modals -->
    <VTFKPDFPreviewModal :open="pdfPreview !== undefined" :base64="pdfPreview" title='Lukk modal' :passedProps="{ onDismiss: () => { pdfPreview = undefined; }}"/>
  </div>
</template>

<script>
  /*
    Import dependencies
  */
  // VTFK komponenter
  import { Button, Spinner, Checkbox, PDFPreviewModal } from '@vtfk/components'

  // Prosjektkomponenter
  import UploadField from '../components/UploadField.vue'
  import Map from '../components/Map.vue'
  import StatCards from '../components/StatCards.vue'
  import Loading from './Loading.vue'
  import MatrikkelTable from '../components/MatrikkelTable.vue';
  import DispatchStatusSelect from '../components/DispatchStatusSelect.vue';
  import SchemaFields from '../components/SchemaFields.vue';

  // Dependencies
  import MatrikkelProxyClient from '../lib/matrikkelProxyClient'
  import DxfParser from 'dxf-parser'
  import proj4 from 'proj4';
  import { polygon as turfPolygon }  from '@turf/helpers';
  import turfArea from '@turf/area';
  import Sjablong from 'sjablong';
  import merge from 'lodash.merge'
  // import axios from 'axios';

  // Custom error class
  import AppError from '../lib/vtfk-errors/AppError';

  export default {
    name: 'dispatchEditor',
    components: {
      'VTFKButton': Button,
      'VTFKSpinner': Spinner,
      'VTFKCheckbox': Checkbox,
      'VTFKPDFPreviewModal': PDFPreviewModal,
      UploadField,
      Map,
      StatCards,
      MatrikkelTable,
      DispatchStatusSelect,
      SchemaFields,
      Loading,
    },
    props: {
      dispatchObject: {
        type: Object
      }
    },
    data() {
      return {
        error: undefined,
        modalError: undefined,
        dispatch: {
          title: '',
          prosjektnr: '', //Obs la til denne
          body: '',
          template: undefined,
          templateData: {},
          matrikkelEnheter: undefined,
          stats: {
            affectedCount: null,
            area: null,
            totalOwners: null,
            privateOwners: null,
            businessOwners: null,
            units: []
          },
          polygon: {
            coordinatesystem: 'EUREF89 UTM Sone 32',
            areal: null,
            vertices: [],
            extremes: {
              north: undefined,
              west: undefined,
              east: undefined,
              south: undefined,
              center: undefined
            }
          },
          geopolygon: {
            coordinateSystem: 'WGS 84',
            vertices: [],
            extremes: {
              north: undefined,
              west: undefined,
              east: undefined,
              south: undefined,
              center: undefined
            }
          }
        },
        uploadedFile: undefined,
        isLoadingTemplates: true,
        isParsingFile: false,
        isMatrikkelApproved: false,
        isFirstLevelDispatchApproved: false,
        hasLoadedFile: false,
        isContactingMatrikkel: false,
        statItems: [],
        eierforhold: [],
        eiere: [],
        pdfPreview: undefined,
        isTemplateSelectorOpen: true,
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
        templates: [],
        selectedTemplate: undefined,
        selectedTemplateSchema: undefined,
        selectedTmpl: {
          template: undefined,
          schema: undefined
        }
      }
    },
    computed: {
      isAllRequiredMatrikkelInfoRetreived() {
        const m = this.dispatch.stats;
        if(m.affectedCount !== null && m.area !== null && m.totalOwners !== null) {
          return true;
        }
        return false;
      },
      isDispatchFilledInn() {
        if(this.dispatch.title && this.dispatch.body && this.dispatch.template) { return true; }
        return false;
      },
      mode() {
        if(!this.dispatch || this.dispatch._id === undefined) { return 'new'; }
        return 'edit';
      },
      isReadOnly() {
        if(this.dispatch && (this.dispatch.status === 'inprogress' || this.dispatch.status === 'completed')) { return true; }
        return false;
      },
      availableTemplates() {
        return this.templates;
      },
      isRequiredTemplateDataFilledIn() {
        if(!this.selectedTemplateSchema) { return false }
        const isValid = Sjablong.validateData(this.selectedTemplateSchema, this.dispatch.templateData);
        console.log('Is valid?');
        console.log(isValid);
        // try {
          
        // } catch(err) {
        //   console.log(err);
        //   return false;
        // }
        
        return true;
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
        this.hasLoadedFile = false;
        this.isParsingFile = false;
        this.isContactingMatrikkel = false;

        // Data
        this.uploadedFile = undefined;
        this.statItems = [];
        this.error = undefined;
      },
      async getDataFromMatrikkelAPI(polygon) {
        try {
          /*
            Input validatering
          */
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

          /*
            Initialiser
          */
          this.isContactingMatrikkel = true;
          let matrikkelClient = new MatrikkelProxyClient();

          /*
            Hent MatrikkelEnhetIDer som finnes innenfor polygonet
          */
          let matrikkelEnhetIds = await matrikkelClient.getMatrikkelEnheter(polygon, { query: { flatten: true, metadata: false } });
          if(!matrikkelEnhetIds && matrikkelEnhetIds.length) {
            throw new AppError('Ingen MatrikkelIDer funnet', 'Vi klarte ikke å finne noen matrikkelinformasjon innenfor dette polygonet');
          }

          /*
            Hent MatrikkelData på hver av IDene
          */
          // Lag ett request for å kontakte store-service for informasjon om IDene
          let matrikkelEnhetRequestItems = [];
          matrikkelEnhetIds.forEach((item) => {
            matrikkelEnhetRequestItems.push({
              type: 'MatrikkelenhetId',
              namespace: 'http://matrikkel.statkart.no/matrikkelapi/wsapi/v1/domain/matrikkelenhet',
              value: item
            })
          })

          // Hent ut data for alle matrikkel enhetene
          let matrikkelEnheter = await matrikkelClient.getStoreItems(matrikkelEnhetRequestItems);

          // Håndter feil
          if(!matrikkelEnheter || matrikkelEnheter.length === 0) {
            throw new AppError('Ingen MatrikkelEnheter funnet', 'Vi klarte ikke å finne noen matrikkelinformasjon for de ' + matrikkelEnhetIds.length + ' idene');
          } else if (matrikkelEnhetIds.length > matrikkelEnheter.length) {
            let deviation = matrikkelEnhetIds.length - matrikkelEnheter.length;
            let notFoundIDs = [];
            matrikkelEnhetIds.forEach((id) => {
              let match = matrikkelEnheter.find((m) => m.id === id);
              if(!match) { notFoundIDs.push(id); }
            })
            throw new AppError('Færre matrikkel enheter er returnert', 'MatrikkelAPIet returnerte ' + deviation + ' færre enheter enn det vi etterspurte \n' + notFoundIDs);
          }
          else if(matrikkelEnheter.length > matrikkelEnhetIds.length) {
            throw new AppError('For mange matrikkelenheter er returnert', 'Vi fant ' + matrikkelEnheter.length + ' IDer, men skulle kun hatt ' + matrikkelEnheter.length + '.');
          }

          /*
            Hent ut alle eierforhold innad for MatrikkelEnhetene
          */
          let matrikkelEierforhold = []
          matrikkelEnheter.forEach((enhet) => {
            if(!Array.isArray(enhet.eierforhold)) {
              enhet.eierforhold = [enhet.eierforhold];
            }
            enhet.eierforhold.forEach((eierforhold) => {
              matrikkelEierforhold.push(eierforhold)
            })
          })
          this.eierforhold = matrikkelEierforhold;

          /*
            Hent ut alle eier-informasjon for hver av eierforholdene
          */
          // Finn all unike eier IDer i alle eierforholdene
          let unikeEierIDer = [];
          matrikkelEierforhold.forEach((eierforhold) => {
            if(!unikeEierIDer.find((id) => id === eierforhold.eierId)) {
              unikeEierIDer.push(eierforhold.eierId);
            }
          })

          // Lag en API request for de forskjellige eierne
          let matrikkelEierRequestItems = [];
          unikeEierIDer.forEach((id) => {
            matrikkelEierRequestItems.push({
              type: 'PersonId',
              namespace: 'http://matrikkel.statkart.no/matrikkelapi/wsapi/v1/domain/person',
              value: id
            })
          })

          // Hent ut alle eiere fra Matrikkel API
          let matrikkelEiere = await matrikkelClient.getStoreItems(matrikkelEierRequestItems);
          this.eiere = matrikkelEiere;

          if(!matrikkelEiere || matrikkelEiere.length === 0) {
            throw new AppError('Ingen eiere er funnet', 'Vi spurte matrikkelen om ' + matrikkelEierRequestItems.length + ' eiere, men fikk ingen tilbake');
          } else if(matrikkelEierRequestItems.length > matrikkelEiere.length) {
            throw new AppError('Ingen eiere er funnet', 'Vi spurte matrikkelen om ' + matrikkelEierRequestItems.length + ' eiere, men fikk kun ' + matrikkelEiere.length + ' tilbake');
          }

          /*
            Oppdater hovedmatrikkel objekt med innhentet eierinformasjon
          */
          matrikkelEnheter.forEach((enhet) => {
            enhet.eierforhold.forEach((eierforhold) => {
              let match = matrikkelEiere.find((eier) => MatrikkelProxyClient.getItemValue(eier.id) == eierforhold.eierId)
              eierforhold.eier = match;
            })
          })

          /*
            Legg til stat cards
          */
          this.statItems.push({ text: 'Enheter', value: matrikkelEnhetIds.length })
          this.statItems.push({ text: 'Unike eiere', value: matrikkelEiere.length })
          let juridiskeEiere = matrikkelEiere.filter((e) => e.$type.toLowerCase().includes('juridisk'));
          this.statItems.push({ text: 'Juridiske eiere', value: juridiskeEiere.length })
          this.statItems.push({ text: 'Private eiere', value: matrikkelEiere.length - juridiskeEiere.length })
          if(this.dispatch.stats.area > 1000) {
            this.statItems.push({ text: 'Areal', value: this.dispatch.stats.area / 1000, postvalue: ' KM²'})
          } else {
            this.statItems.push({ text: 'Areal', value: this.dispatch.stats.area, postvalue: ' M²'})
          }
          

          /*
            Fyll data inn i dispatch objekt
          */
          this.dispatch.stats.affectedCount = matrikkelEnhetIds.length;
          this.dispatch.stats.privateOwners = matrikkelEiere.length - juridiskeEiere.length;
          this.dispatch.stats.businessOwners = juridiskeEiere.length;
          this.dispatch.stats.totalOwners = matrikkelEiere.length;

          matrikkelEnheter.forEach((enhet) => {
            // Hent ut generell informasjon om matrikkel enheten som skal lagres i databasen
            let matrikkelUnit = {
              id: enhet.id,
              type: enhet.type,
              bruksnavn: enhet.bruksnavn,
              bruksnummer: enhet.bruksnummer,
              gardsnummer: enhet.gardsnummer,
              festenummer: enhet.festenummer,
              kommuneId: enhet.kommuneId,
              utgatt: enhet.utgatt,
              antallEiere: 1
            }
            // Kalkuler antall eiere
            if(enhet.eierforhold && Array.isArray(enhet.eierforhold)) {
              matrikkelUnit.antallEiere = enhet.eierforhold.length;
            }
            this.dispatch.stats.units.push(matrikkelUnit);
          })

          this.dispatch.matrikkelEnheter = matrikkelEnheter;

          this.isContactingMatrikkel = false;
        } catch(err) {
          this.setError(err);
        }
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

          // Values for keeping track of the lowest and highest coordinate-values
          let lowX = vertices[0].x;
          let highX = vertices[0].x;
          let lowY = vertices[0].y;
          let highY = vertices[0].y;
          
          // Points for all the 4 extreme coordinates in the polygon
          let northPoint = undefined;
          let westPoint = undefined;
          let eastPoint = undefined;
          let southPoint = undefined;

          // An array version of the non-transformed vertices (using [123, 321] instead of { x: 123, y: 321})
          let arrayifiedVertices = [];
          // The array that stores all the transformed vertices
          let transformedVertices = [];

          vertices.forEach((vertice) => {
            // Make a copy of the vertice to not modify the source object
            let vCopy = JSON.parse(JSON.stringify(vertice))
            // Add the non transformed values into the array
            arrayifiedVertices.push([vertice.y, vertice.x]);
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
          // Closing the polygon if necessary
          if(transformedVertices[0] != transformedVertices[transformedVertices.length - 1]) {
            transformedVertices.push(transformedVertices[0]);
          }
          
          // Calculate the center of the polygon
          let center = {
            x: (lowX + highX) / 2,
            y: (lowY + highY) / 2
          }
          let transformedCenter = proj4('EPSG:25832', 'EPSG:4326', JSON.parse(JSON.stringify(center)));

          // Calculate the area of the polygon in square meters
          let tp = turfPolygon([transformedVertices])
          let area = turfArea(tp);
          if(area) {
            this.dispatch.polygon.area = Math.round(area);
            this.dispatch.stats.area = this.dispatch.polygon.area;
            this.dispatch.geopolygon.area = this.dispatch.polygon.area;
          }

          // Calculate the coordinates for the outmost points
          let translatedNorth = proj4('EPSG:25832', 'EPSG:4326', {x: northPoint.x , y: northPoint.y});
          let translatedWest = proj4('EPSG:25832', 'EPSG:4326', {x: westPoint.x , y: westPoint.y});
          let translatedEast = proj4('EPSG:25832', 'EPSG:4326', {x: eastPoint.x , y: eastPoint.y});
          let translatedSouth = proj4('EPSG:25832', 'EPSG:4326', {x: southPoint.x , y: southPoint.y});

          // Set the polygon for the dispatch object
          this.dispatch.polygon.coordinatesystem = 'EUREF89 UTM Sone 32';
          this.dispatch.polygon.vertices = arrayifiedVertices;
          this.dispatch.polygon.extremes = {
            north: [northPoint.y, northPoint.x],
            west: [westPoint.y, westPoint.x],
            east: [eastPoint.y, eastPoint.x],
            south: [southPoint.y, southPoint.x],
            center: [center.y, center.x]
          };

          // Set the geopolygon for the dispatch object
          this.dispatch.geopolygon.coordinateSystem = 'WGS84';
          this.dispatch.geopolygon.vertices = transformedVertices;
          this.dispatch.geopolygon.extremes = {
            north: [translatedNorth.y, translatedNorth.x],
            west: [translatedWest.y, translatedWest.x],
            east: [translatedEast.y, translatedEast.y],
            south: [translatedSouth.y, translatedSouth.x],
            center: [transformedCenter.y, transformedCenter.x]
          }

          // Set that the file has been parsed
          this.isParsingFile = false;
        } catch (err) {
          this.setError(err);
          console.error(err);
        }
      },
      parseMatrikkelEnheter(Enheter) {
        if(!Enheter) { return; }
        if(!Array.isArray(Enheter)) { Enheter = [Enheter]; }

        let parsed = [];
        Enheter.forEach((enhet) => {
          let item = {}
          let type = MatrikkelProxyClient.getItemType(enhet);

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
            item.gardsnummer = enhet.matrikkelnummer.gardsnummer;
            item.bruksnummer = enhet.matrikkelnummer.bruksnummer;
            item.festenummer = enhet.matrikkelnummer.festenummer;
            item.kommuneId = enhet.matrikkelnummer.kommuneId;
          }

          // Hent ut eierinformasjon
          if(enhet.eierforhold) {
            if(enhet.eierforhold.item) { enhet.eierforhold = enhet.eierforhold.item }
            if(!Array.isArray(enhet.eierforhold)) { enhet.eierforhold = [enhet.eierforhold]; }

            let eiere = [];
            enhet.eierforhold.forEach((eierforhold) => {
              eiere.push({
                datoFra: eierforhold.datoFra,
                type: MatrikkelProxyClient.getItemType(eierforhold),
                eierId: eierforhold.eierId,
                eierforholdKode: eierforhold.eierforholdKodeId,
                kommuneId: eierforhold.kommuneId,
                andelsnummer: eierforhold.andelsnummer,
                andel: eierforhold.andel,
              })
            })
            item.eiere = eiere;
          }

          parsed.push(item);
        })
        return parsed;
      },
      async submitMassDispatch() {
        let today = new Date()
        const dataObjc = {
          
          body: "Denne må defineres, hentes ikke i this.dispatch",
          status: "inprogress",
          createdDate: today,
          createdBy: "Noen André",
          createdById: "00000000-0000-0000-0000-000000000000",
          modifiedDate: today,
          modifiedBy: "André",
          modifiedById: "00000000-0000-0000-0000-000000000000",
        }

        var postObject = Object.assign(this.dispatch, dataObjc)

        if(confirm('Er du helt sikker på at du vil sende inn?')) {
          this.isLoading = true
          try {
            await this.$store.dispatch('postDispatches', postObject)
          } catch(err) {
          this.error = err;
          }
          try {
            await this.$store.dispatch('postDispatches', postObject)
          } catch(err) {
          this.error = err;
          }
          this.isLoading = false
          this.$router.push('Utsendelser') 
        }
      },
      onTemplateChanged(e) {
        this.dispatch.template = e._id;
        this.selectedTemplate = e;

        if(e.template) {
          const tmp = Buffer.from(e.template, 'base64').toString('utf8');
          this.selectedTemplateSchema = Sjablong.generateSchema(tmp);
        }
      },
      onTextChange(e) {
        console.log(e);
      },
      onTitleChange(title) {
        this.dispatch.title = title
      },
      onProsjektNrChange(prosjektnr) {
        this.dispatch.prosjektnr = prosjektnr
      },
      updateProject(key, value) {
        console.log('Setting "' + key + '" to "' + value + '"');
        this.$set(this.project, key, value)
      },
      async loadTemplates() {
        this.isLoadingTemplates = true;

       try {
          this.templates = await this.$store.dispatch('getTemplates');
        } catch (err) {
          this.error = new AppError('Kunne ikke hente hente inn maler', err);
          return;
        }

        let sameTemplate = this.$store.state.templates.find((t) => t._id === this.dispatch.template)
        if(sameTemplate) this.onTemplateChanged(sameTemplate);

        this.isLoadingTemplates = false;
      },
      previewPDF() {
        if(!this.selectedTemplate && !this.selectedTemplate) {
          alert('Forhåndsvisning kan ikke gjøres når mal ikke er valgt');
          return;
        }

        let data = merge(this.dispatch.data, this.selectedTemplate.data);

        let request = {
          preview: true,
          documentDefinitionId: this.selectedTemplate.documentDefinitionId,
          template: this.selectedTemplate.template,
          data: data
        }

        this.$store.dispatch('getPDFPreview', request)
      }
    },
    created() {
      if(this.$props.dispatchObject) {
        this.$set(this, 'dispatch', this.$props.dispatchObject)
      }

      this.loadTemplates();
    }
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

  .mt-1 {
    margin-top: 1rem;
  }
</style>