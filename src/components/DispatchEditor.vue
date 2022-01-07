<template>
  <div style="margin-top: 1rem;">
    <!-- Feilmelding -->
    <ErrorField v-if="error" :error="error" v-on:resetClicked="reset(true)" :showResetButton="true" />
    <!-- Loaders -->
    <Loading v-else-if="isLoadingTemplates" title="Laster inn maler" />
    <!-- Fil opplasting -->
    <div v-else-if="mode === 'new' && !uploadedFile">
      <h2>Last opp polygonet</h2>
      <UploadField v-on:uploaded="(files) => parseFiles(files)" :convertDataToDataUrl="false"/>
    </div>
    <div v-else-if="isParsingFile" class="centeredColumn">
      <Loading title="Filen behandles" message="Dette kan ta noen sekunder" />
    </div>
    <!-- Kart og matrikkel -->
    <div v-else class="center-content">
      <Map
        style="max-width: 750px"
        :polygons="dispatch.polygons"
        />  
      <div v-if="!isAllRequiredMatrikkelInfoRetreived && !isContactingMatrikkel" class="centeredColumn" style="margin-top: 1rem;">
        <VTFKButton :passedProps="{ onClick: () => getDataFromMatrikkelAPI() }">Hent matrikkel infromasjon</VTFKButton>
        <VTFKButton v-if="!isMatrikkelApproved" :passedProps="{onClick: () => {reset()}}">Angre</VTFKButton>
      </div>
      <div v-else-if="isContactingMatrikkel" class="shadow" style="margin-top: 1rem; padding: 1rem 1rem; border-radius: 20px; background-color: #CFEBF2;">
        <Loading title="Kontaker matrikkelen" :message="matrikkelLoadingMessage" :submessage="matrikkelLoadingSubmessage"/>
      </div>
      <div v-else class="centeredColumn" style="margin-top: 1rem;">
        <!-- Cards som viser stats om informasjonen -->
        <StatCards :items="statItems"/>
        <!-- Matrikkel eiere -->
        <h2>Eiere / Mottakere</h2>
        <MatrikkelOwnerTable :items="dispatch.owners" item-key="id" @excludeOwner="(e) => excludeOwner(e)" />
        <div v-if="dispatch.excludedOwners" style="width: 100%;">
          <h2>Ekskluderte mottakere</h2>
          <MatrikkelOwnerTable type="excluded" :items="dispatch.excludedOwners" item-key="id" @includeOwner="(e) => includeOwner(e)" style="margin-top: 1rem" />
        </div>
        <div v-if="mode === 'new'" class="centeredColumn">
          <!-- Angreknapp -->
          <VTFKButton v-if="!isMatrikkelApproved" :passedProps="{onClick: () => {reset()}}">Angre</VTFKButton>
          <!-- Aksept for at matrikkel info ser ok ut -->
          <v-checkbox v-if="dispatch.stats.affectedCount" v-model="isMatrikkelApproved" :disabled="isMatrikkelApproved" label="Matrikkelinformasjonen ser korrekt ut"/>
        </div>
      </div>
      <!-- Prosjekt informasjon -->
      <div v-if="isMatrikkelApproved || mode === 'edit'" class="card shadow centeredColumn" style="margin-top: 1rem;">
        <div style="width: 60%" class="centeredColumn">
          <h1>Masseutsendelse</h1>
          <DispatchStatusSelect class="centeredColumn" v-if="mode === 'edit'" v-model="dispatch.status" :disabled="isLocked"/>
          <!-- En input for prosjekt navn, en for prosjekt nr -->
          <VTextField 
            v-model="dispatch.title"
            :disabled="isReadOnly"
            placeholder="Angi et prosjektnavn"
            hint="Angi et prosjektnavn"
            label="Prosjekt navn"
            :required="true"
            style="max-width: 750px; width: 100%;"
          >
            <template #label>
              <span class="required"><strong>* </strong></span>Prosjektnavn
            </template>
          </VTextField>
          <VTextField 
            v-model="dispatch.projectnumber"
            :disabled="isReadOnly"
            placeholder="Angi et nummer"
            hint="Angi et nummer"
            label="Prosjekt nummer"
            :required="true"
            style="max-width: 750px; width: 100%;"
          >
            <template #label>
              <span class="required"><strong>* </strong></span>Prosjektnummer
            </template>
          </VTextField>
          <VTextField 
            v-model="dispatch.archivenumber"
            :disabled="isReadOnly"
            placeholder="Angi et nummer"
            hint="Angi et nummer"
            label="Arkivnummer"
            :required="true"
            style="max-width: 750px; width: 100%;"
          >
            <template #label>
              <span class="required"><strong>* </strong></span>Arkivnummer
            </template>
          </VTextField>
          <VSelect
            label="Velg mal"
            placeholder="Velg mal"
            :disabled="isReadOnly"
            :value="dispatch.template"
            :items="this.templates"
            item-text="name"
            item-value="_id"
            return-object
            @change="(e) => onTemplateChanged(e)" 
            style="max-width: 750px; width: 100%;"
          />
          <div v-if="selectedTemplateSchema && selectedTemplateSchema.properties && Object.keys(selectedTemplateSchema.properties).length > 0" style="max-width: 750px; width: 100%;">
            <h2>Flettefelter</h2>
            <SchemaFields
              v-model="dispatch.template.data"
              :schema="selectedTemplateSchema"
              :disabled="isReadOnly"
              @changed="onTemplateDataChanged()"
            />
          </div>
          <h3 style="margin-bottom: 0.2rem">Vedlegg</h3>
          <upload-field v-model="dispatch.attachments" style="width: 100%" :downloadBaseUrl="`${$config.MASSEUTSENDELSEAPI_BASEURL}api/blobs/${dispatch._id}/`" />
          <div v-if="mode === 'new'" class="centeredColumn" style="margin-top: 1rem">
            <VTFKButton
              class="mt-1"
              :disabled="!isRequiredTemplateDataFilledIn"
              :passedProps="{onClick: () => { previewPDF() }}">Se forhåndsvisning
            </VTFKButton>
          </div>
          <div v-if="mode === 'new'" class="centeredColumn" style="margin-top: 2rem">
            <v-checkbox v-model="isDispatchApproved" :label="'Følgende informasjon skal sendes ut til ' + dispatch.owners.length + ' mottakere'" />
          </div>
          <div style="display: flex; justify-content: center; gap: 0.5rem; width: 100%;">
            <VTFKButton
              style="margin-top: 1rem;"
              :disabled="!isReadyToSave"
              type='secondary' size='small'
              :passedProps="{onClick: () => { saveOrEditDispatch(); }}"
            >
              <span v-if="mode == 'new'">Send til godkjenning</span>
              <span v-else>Lagre</span>
            </VTFKButton>
            <VTFKButton v-if="mode === 'new'"
              style="margin-top: 1rem;"
              type='secondary' size='small'
              :passedProps="{onClick: () => {reset()}}"
            >Start på nytt
            </VTFKButton>
            <VTFKButton v-else
              style="margin-top: 1rem;"
              type='secondary' size='small'
              :passedProps="{onClick: () => {$emit('close')}}"
            >Lukk
            </VTFKButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  /*
    Import dependencies
  */
  // VTFK komponenter
  import { Button } from '@vtfk/components'

  // Prosjektkomponenter
  import UploadField from './uploader/UploadField.vue'
  import Map from '../components/Map.vue'
  import StatCards from '../components/StatCards.vue'
  import Loading from './Loading.vue'
  import MatrikkelOwnerTable from '../components/MatrikkelOwnerTable.vue';
  import DispatchStatusSelect from '../components/DispatchStatusSelect.vue';
  import SchemaFields from '../components/SchemaFields.vue';

  // Dependencies
  import MatrikkelProxyClient from '../lib/matrikkelProxyClient'
  import Sjablong from 'sjablong';
  import merge from 'lodash.merge'
  import pick from 'lodash.pick';
  import PolyParser from '../lib/polyparser/polyparser';
 
  // Config
  import config from '../../config';

  // Custom error class
  import AppError from '../lib/vtfk-errors/AppError';

  export default {
    name: 'dispatchEditor',
    components: {
      'VTFKButton': Button,
      UploadField,
      Map,
      StatCards,
      MatrikkelOwnerTable,
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
        /*
          State
        */
        // Error object - This has draw precidence over everthing else in this component
        error: undefined,
        // The new or edited dispatch object
        dispatch: {
          title: '',
          projectnumber: '',
          archivenumber: '',
          template: {
            _id: undefined,
            version: null,
            name: undefined,
            description:undefined,
            documentData: {},
            data: undefined,
            template: undefined
          },
          attachments: [],
          owners: [],
          excludedOwners: [],
          matrikkelEnheter: undefined,
          stats: {
            affectedCount: null,
            area: null,
            totalOwners: null,
            privateOwners: null,
            businessOwners: null,
            units: []
          },
          polygons: {
            ESPG: '',
            coordinatesystem: '',
            filename: '',
            areal: null,
            extremes: {
              north: undefined,
              west: undefined,
              east: undefined,
              south: undefined,
              center: undefined
            },
            polygons: [],
          }
        },
        // The initial state of the dispatch (Used for not deactivating the save button when approving)
        initialDispatchStatus: undefined,
        // The file provided by the fileuploader
        uploadedFile: undefined,
        // The genereated statistics from the MatrikkelAPI
        statItems: [],
        // The templates received from the API
        templates: [],
        // The selected template in the template picker
        selectedTemplate: undefined,
        // The generated schema after picking a template
        selectedTemplateSchema: undefined,
        matrikkelLoadingMessage: '',
        matrikkelLoadingSubmessage: '',
        /*
          Boolean state
        */
        // Are templates currently being loaded?
        isLoadingTemplates: true,
        // Is the file currently being parsed?
        isParsingFile: false,
        // Is the matrikkel information approved?
        isMatrikkelApproved: false,
        // Has all required template-data been filled in?
        isRequiredTemplateDataFilledIn: false,
        // Is the matrikkel API currently beeing contacted?
        isContactingMatrikkel: false,
        // Is the dispatch approved to be sent inn?
        isDispatchApproved: false,
        // Has the file been loaded?
        hasLoadedFile: false,
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
      mode() {
        if(!this.dispatch || this.dispatch._id === undefined) { return 'new'; }
        return 'edit';
      },
      isLocked() {
        if(this.dispatch && this.dispatch.status === 'inprogress' || this.dispatch.status === 'completed') return true;
        return false;
      },
      isReadOnly() {
        if(this.isLocked) return true;
        if(this.initialDispatchStatus === 'notapproved') return false;
        if(this.dispatch && (this.dispatch.status === 'approved')) { return true; }
        return false;
      },
      isReadyToSave() {
        if(this.isReadOnly) return false;
        if(!this.isRequiredTemplateDataFilledIn || !this.dispatch.title || !this.dispatch.projectnumber || !this.dispatch.archivenumber) return false;
        if(this.mode === 'new' && (!this.isDispatchApproved || !this.isMatrikkelApproved)) return false;
        return true;
      },
    },
    methods: {
      reInitialState() {
        return {
            dispatch: {
                title: '',
                projectnumber: '',
                archivenumber: '',
                template: {
                  _id: undefined,
                  version: null,
                  name: undefined,
                  description:undefined,
                  documentData: {},
                  data: undefined,
                  template: undefined
                },
                matrikkelEnheter: undefined,
                owners: [],
                excludeOwners: [],
                stats: {
                  affectedCount: null,
                  area: null,
                  totalOwners: null,
                  privateOwners: null,
                  businessOwners: null,
                  units: []
                },
                polygons: {
                  EPSG: '',
                  polygons: [],
                  extremes: {
                    north: undefined,
                    west: undefined,
                    east: undefined,
                    south: undefined,
                    center: undefined
                  },
                }
              },
              // The file provided by the fileuploader
              uploadedFile: undefined,
              // The genereated statistics from the MatrikkelAPI
              statItems: [],
              // The templates received from the API
              // Templates will not reload if you press the "Angre" or "Start på nytt" button, 
              // therefore we will not reset the templates array.
              // templates: [], 
              // The selected template in the template picker
              selectedTemplate: undefined,
              // The generated schema after picking a template
              selectedTemplateSchema: undefined,
              /*
                Boolean state
              */
              // Are templates currently being loaded?
              // When we reInitialState the state, isLoadingTemplates = false. 
              isLoadingTemplates: false,
              // Is the file currently being parsed?
              isParsingFile: false,
              // Is the matrikkel information approved?
              isMatrikkelApproved: false,
              // Has all required template-data been filled in?
              isRequiredTemplateDataFilledIn: false,
              // Is the matrikkel API currently beeing contacted?
              isContactingMatrikkel: false,
              // Is the dispatch approved to be sent inn?
              isDispatchApproved: false,
              // Has the file been loaded?
              hasLoadedFile: false,
        }
      },
      reset(force = false) {
        // Validation
        if(force === false && !confirm('Er du helt sikker på at du vil starte på nytt?')) return;

        // Set the data back to the baseline
        Object.assign(this.$data, this.reInitialState());

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
      async getDataFromMatrikkelAPI() {
        try {
          /*
            Initialiser
          */
          this.isContactingMatrikkel = true;
          let matrikkelClient = new MatrikkelProxyClient();
          let totalVerticesCount = 0;
          this.dispatch.polygons.polygons.forEach((p) => totalVerticesCount += p.vertices.length)
          /*
            Hent MatrikkelEnhetIDer som finnes innenfor polygonet
          */
          this.matrikkelLoadingMessage = 'Innhenter alle enhets-ider innenfor polygonene'
          this.matrikkelLoadingSubmessage = `Spør om ${this.dispatch.polygons.polygons.length} polygoner med ${totalVerticesCount} vertiser`
          let matrikkelEnhetIds = [];
          for (const polygon of this.dispatch.polygons.polygons) {
            let ids = await matrikkelClient.getMatrikkelEnheterFromPolygon(polygon.vertices, { query: { flatten: true, metadata: false } });
            // Add any ids that don't already exists
            for(const id of ids) {
              if(!matrikkelEnhetIds.includes(id)) matrikkelEnhetIds.push(id);
            }
          }
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
          this.matrikkelLoadingMessage = `Innhenter informasjon om ${matrikkelEnhetIds.length} Matrikkelenheter`;
          this.matrikkelLoadingSubmessage = ``
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
          let matrikkelEnheterUtenEiere = [];
          matrikkelEnheter.forEach((enhet) => {
            // If the eierforhold is empty
            if(!enhet.eierforhold) {
              //TODO: Hør med SMM hvordan dette skal håndteres
              matrikkelEnheterUtenEiere.push(enhet); 
              return;
            }
            // Convert the eierforhold to array if it is just an object
            if(!Array.isArray(enhet.eierforhold)) enhet.eierforhold = [enhet.eierforhold];
            if(enhet.eierforhold.length > 0) {
              enhet.eierforhold.forEach((eierforhold) => {
                matrikkelEierforhold.push(eierforhold)
              })
            }
          })

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
          this.matrikkelLoadingMessage = `Innhenter informasjon om ${unikeEierIDer.length} eiere av ${matrikkelEnhetIds.length} matrikkelenheter`
          let matrikkelEiere = await matrikkelClient.getStoreItems(matrikkelEierRequestItems);

          if(!matrikkelEiere || matrikkelEiere.length === 0) {
            throw new AppError('Ingen eiere er funnet', 'Vi spurte matrikkelen om ' + matrikkelEierRequestItems.length + ' eiere, men fikk ingen tilbake');
          } else if(matrikkelEierRequestItems.length > matrikkelEiere.length) {
            throw new AppError('Ingen eiere er funnet', 'Vi spurte matrikkelen om ' + matrikkelEierRequestItems.length + ' eiere, men fikk kun ' + matrikkelEiere.length + ' tilbake');
          }

          /*
            Generer ett datasett hvor eiere er først med alle eierforhold under
          */
          let ownerCentric = MatrikkelProxyClient.getMatrikkelEnheterOwnerCentric(matrikkelEnheter, matrikkelEiere);

          // Remove any pre-removed users
          if(config.EXCLUDED_OWNER_IDS && Array.isArray(config.EXCLUDED_OWNER_IDS)) {
            this.dispatch.excludedOwners = ownerCentric.filter((o) => config.EXCLUDED_OWNER_IDS.includes(o.nummer));
            this.dispatch.owners = ownerCentric.filter((o) => !config.EXCLUDED_OWNER_IDS.includes(o.nummer));
          } else {
            this.dispatch.owners = ownerCentric;
          }

          // Hent ut juridiske eiere
          let juridiskeEiere = matrikkelEiere.filter((e) => e._type.toLowerCase().includes('juridisk'));

          /*
            Fyll data inn i dispatch objekt
          */
          this.dispatch.stats.affectedCount = matrikkelEnhetIds.length;
          this.dispatch.stats.privateOwners = matrikkelEiere.length - juridiskeEiere.length;
          this.dispatch.stats.businessOwners = juridiskeEiere.length;
          this.dispatch.stats.totalOwners = matrikkelEiere.length;
          this.dispatch.stats.area = this.dispatch.polygons.area;

          /*
            Legg til stat cards
          */
          this.statItems.push({ text: 'Enheter', value: matrikkelEnhetIds.length })
          this.statItems.push({ text: 'Unike eiere', value: matrikkelEiere.length })
          this.statItems.push({ text: 'Juridiske eiere', value: juridiskeEiere.length })
          this.statItems.push({ text: 'Private eiere', value: matrikkelEiere.length - juridiskeEiere.length })
          if(this.dispatch.stats.area > 1000) {
            this.statItems.push({ text: 'Areal', value: Math.round(this.dispatch.stats.area / 1000), postvalue: ' KM²'})
          } else {
            this.statItems.push({ text: 'Areal', value: Math.round(this.dispatch.stats.area), postvalue: ' M²'})
          }

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
          this.error = err;
        }
      },
      excludeOwner(owner) {
        // Add the owner to the excludedOwners array
        if(!this.dispatch.excludedOwners) this.dispatch.excludedOwners = [];
        this.dispatch.excludedOwners.push(owner);
        this.$set(this.dispatch, 'excludedOwners', this.dispatch.excludedOwners);
        // Filter away the exluded owner from the owners array
        this.dispatch.owners = this.dispatch.owners.filter((o) => o.id !== owner.id);
        this.$set(this.dispatch, 'owners', this.dispatch.owners);
        // Flip the checkboxes so they will have to be checked again
        this.isDispatchApproved = false;
      },
      includeOwner(owner) {
        // Add the exlcuded owner
        this.dispatch.owners.push(owner);
        this.$set(this.dispatch, 'owners', this.dispatch.owners);
        // Remove the owner from the exluded array
        this.dispatch.excludedOwners = this.dispatch.excludedOwners.filter((o) => o.id !== owner.id);
        this.$set(this.dispatch, 'excludedOwners', this.dispatch.excludedOwners);
        // Flip the checkboxes so they will have to be checked again
        this.isDispatchApproved = false;
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
          this.uploadedFile = files;
          this.isParsingFile = true;
          let polygons = await PolyParser.parse(files[0], { inverseXY: true });

          // File polygons
          this.$set(this.dispatch, 'polygons', polygons);

          // Set that the file has been parsed
          this.isParsingFile = false;
        } catch (err) {
          console.log('Error');
          console.error(err);
          let error = err;
          if(typeof error === 'string') error = new AppError('Error', error);
          this.error = error;
        }
      },
      async saveOrEditDispatch() {
        // Input validation
        if(!this.isReadyToSave) {
          this.$store.commit('setModalError', new AppError('Kan ikke lagre', 'Det mangler en eller flere felter før du kan lagre'));
          return;
        }
        // User confirmation
        if(!confirm('Er du helt sikker på at du vil sende inn?')) return;

        // Make a copy of the dispatch object before sending in
        var postObject = Object.assign(this.dispatch)

        // Remove template if not specified
        if(!this.dispatch.template || !this.dispatch.template._id) delete postObject.template;

        this.$emit('beforeSave');
        this.isLoading = true
        try {
          if(this.mode === 'new') {
            await this.$store.dispatch('postDispatches', postObject);
          } else if (this.mode === 'edit') {
            await this.$store.dispatch('editDispatches', postObject);
          } else {
            throw new AppError('Kunne ikke lagre', 'Klarte ikke å avgjøre hvordan utsendelsen skulle lagres');
          }
          if(this.$route.path && this.$route.path.toLowerCase() !== '/utsendelser') this.$router.push('Utsendelser');
        } catch(err) {
          this.error = err;
        }
        this.isLoading = false
        this.$emit('saved');
      },
      onTemplateChanged(e) {
        // Generate schema for the selectedTemplate
        const tmp = Buffer.from(e.template, 'base64').toString('utf8');
        this.selectedTemplateSchema = Sjablong.generateSchema(tmp, { requireAll: true })

        // Generate a data object with each of the properties from the schema
        let templateData = Sjablong.createObjectFromSchema(this.selectedTemplateSchema, false);

        // If the template already have data, attempt to overwrite the templateData with them
        if(this.dispatch.template && this.dispatch.template.data) {
          // Get all the properties that exists in the schema
          const matchingKeys = pick(this.dispatch.template.data, Object.keys(templateData));
          // Overwrite templatedata with the matching information in the matching keys
          templateData = merge(templateData, matchingKeys);
        }
        
        // Update the template information
        this.dispatch.template = e
        this.dispatch.template.data = templateData;
        this.selectedTemplate = e;

        // Signal that templatedata has changed
        this.onTemplateDataChanged();
      },
      determineIfTemplateIsOk() {
        if(!this.selectedTemplateSchema || (this.selectedTemplateSchema && this.selectedTemplateSchema.properties && Object.keys(this.selectedTemplateSchema.properties).length === 0)) {
          this.isRequiredTemplateDataFilledIn = true;
        } else {
          try {
            Sjablong.validateData(this.selectedTemplateSchema, this.dispatch.template.data, { requireAll: true });
            this.isRequiredTemplateDataFilledIn = true;
          }
          catch (err) {
            this.isRequiredTemplateDataFilledIn = false;
          }
        }
      },
      onTemplateDataChanged() {
        this.determineIfTemplateIsOk();
      },
      async loadTemplates() {
        this.isLoadingTemplates = true;

        try {
          this.templates = await this.$store.dispatch('getTemplates');
        } catch (err) {
          this.error = err;
          return;
        }

        // Attempt to match template with the dispatch, if applicable
        if(this.dispatch.template) {
          let sameTemplate = this.$store.state.templates.find((t) => t._id === this.dispatch.template._id)
          if(sameTemplate) this.onTemplateChanged(sameTemplate);
        }
        
        this.isLoadingTemplates = false;
      },
      previewPDF() {
        // Input validation
        if(!this.selectedTemplate) {
          alert('Forhåndsvisning kan ikke gjøres når mal ikke er valgt');
          return;
        }

        // Combine data from both the template and the documentTemplate
        let data = merge(this.dispatch.template.data, this.dispatch.template.documentData);

        // Validate that all required data is present
        if(data && Object.keys(data).length > 0) {
          try { Sjablong.validateData(this.selectedTemplateSchema, data, { requireAll: true })}
          catch (err) { console.log(err); return; }
        }

        // Request the PDF preview
        this.$store.dispatch('getPDFPreview', { ...this.dispatch, preview: true })
      }
    },
    created() {
      if(this.$props.dispatchObject) {
        this.$set(this, 'dispatch', this.$props.dispatchObject)
        this.initialDispatchStatus = this.$props.dispatchObject.status;
      }
      this.onTemplateDataChanged();

      this.loadTemplates();
    },
    watch: {
      // This will trigger any time something on the dispatch object has changed
      dispatch: {
        handler: function() {
          // Check if all necessary template data is filled in
          this.determineIfTemplateIsOk();
        },
        deep: true
      }
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