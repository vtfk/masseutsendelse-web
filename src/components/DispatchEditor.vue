<template>
  <div style="margin-top: 1rem;">
    <!-- Feilmelding -->
    <ErrorField v-if="error" :error="error" v-on:resetClicked="reset(true)" :showResetButton="true" />
    <!-- Loaders -->
    <Loading v-else-if="isLoadingTemplates" title="Laster inn maler" />
    <!-- Fil opplasting -->
    <div v-else-if="mode === 'new' && (!dispatch.polygons || !dispatch.polygons.polygons || dispatch.polygons.polygons.length === 0)">
      <h2>Last opp polygonet</h2>
      <UploadField v-on:uploaded="(files) => parseFiles(files)" :convertDataToDataUrl="false" :allowedExtensions="['dxf', 'kml']"/>
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
        <VTFKButton :passedProps="{ onClick: () => getDataFromMatrikkelAPI() }">Hent matrikkelinformasjon</VTFKButton>
        <VTFKButton v-if="!isMatrikkelApproved" :passedProps="{onClick: () => {reset()}}">Angre</VTFKButton>
      </div>
      <div v-else-if="isContactingMatrikkel" class="shadow" style="margin-top: 1rem; padding: 1rem 1rem; border-radius: 20px; background-color: #CFEBF2;">
        <Loading title="Kontakter matrikkelen" :message="matrikkelLoadingMessage" :submessage="matrikkelLoadingSubmessage" :subsubmessage="matrikkelLoadingSubSubMessage"/>
      </div>
      <div v-else class="centeredColumn" style="margin-top: 1rem; width: 100%; max-width: 1200px;">
        <!-- Cards som viser stats om informasjonen -->
        <StatCards v-if="statsCards" :items="statsCards"/>
        <!-- Matrikkel eiere -->
        <div v-if="dispatch.owners === null" style="width: 100%; padding-top: 1rem;">
          <h2 style="margin-bottom: 0.5rem">Utsendelsen er ferdigstilt. Eiere og mottakere er fjernet av personvernhensyn. <br> For å se disse kan du trykke på "Åpne Arkiv" og navigere til "Kontakter"</h2>
        </div>
        <div v-if="dispatch.owners" style="width: 100%;">
          <h2 style="margin-bottom: 0.5rem">Eiere / Mottakere</h2>
          <MatrikkelOwnerTable :items="dispatch.owners" :disableinputs="isReadOnly" item-key="id" @excludeOwner="(e) => excludeOwner(e)" />
        </div>
        <div v-if="dispatch.excludedOwners" style="width: 100%;">
          <h2 style="margin-bottom: 0.5rem">Ekskluderte mottakere</h2>
          <MatrikkelOwnerTable type="excluded" :items="dispatch.excludedOwners" :disableinputs="isReadOnly" item-key="id" @includeOwner="(e) => includeOwner(e)" />
        </div>
        <div v-if="dispatch.matrikkelUnitsWithoutOwners" style="width: 100%;">
          <h2 style="margin-bottom: 0.5rem">Matrikkelenheter uten eierforhold</h2>
          <v-data-table :headers="missingOwnersTableHeaders" :items="dispatch.matrikkelUnitsWithoutOwners" :items-per-page="5" item-key="id.value" class="shadow" />
        </div>
        <div v-if="mode === 'new'" class="centeredColumn">
          <!-- Angreknapp -->
          <VTFKButton v-if="!isMatrikkelApproved" :passedProps="{onClick: () => {reset()}}">Angre</VTFKButton>
          <!-- Aksept for at matrikkel info ser ok ut -->
          <v-checkbox v-if="dispatch.stats.affectedCount" v-model="isMatrikkelApproved" :disabled="isMatrikkelApproved" label="Matrikkelinformasjonen ser korrekt ut"/>
        </div>
      </div>
      <!-- Prosjekt informasjon -->
      <div v-if="isMatrikkelApproved || mode === 'edit'" class="card shadow centeredColumn center-content" style="margin-top: 1rem; width: 100%; max-width: 1200px;">
        <div style="width: 60%" class="centeredColumn">
          <h1>Masseutsendelse</h1>
          <DispatchStatusSelect class="centeredColumn" v-if="mode === 'edit'" v-model="dispatch.status" :disabled="isLocked"/>
          <!-- En input for prosjekt navn, en for prosjekt nr -->
          <v-btn v-if="dispatch.archiveUrl" @click="openUrl(dispatch.archiveUrl)" style="justify-self: flex-start; align-self: start;">
            <v-icon right dark>
              mdi-file-cabinet
            </v-icon>
            Åpne arkiv
          </v-btn>
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
            hint="Angi et saksnummer som allerede eksiterer i P360"
            label="P360 saksnummer"
            :required="true"
            style="max-width: 750px; width: 100%;"
          >
            <template #label>
              <span class="required"><strong>* </strong></span>P360 saksnummer
            </template>
          </VTextField>
          <!-- <VTextField
            :value="templateParagraph"
            label="Paragraf"
            placeholder="Hvis utsendelsen skal untas offentligheten legg inn paragrafen"
            hint="Hvis utsendelsen skal untas offentligheten legg inn paragrafen"
            :disabled="isReadOnly"
            @input="(e) => updateParagraph(e)"
            style="max-width: 750px; width: 100%;"
          > 
          </VTextField>-->
          <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; width: 100%; max-width: 750px;">
            <VSelect
              label="Velg mal"
              placeholder="Velg mal"
              :disabled="isReadOnly"
              :value="getMatchingTemplate()"
              :items="this.templates"
              item-text="name"
              item-value="_id"
              return-object
              @change="(e) => onTemplateChanged(e)" 
              style="max-width: 750px; width: 100%;"
            />
            <VTFKButton v-if="dispatch.template && dispatch.template._id" :disabled="isReadOnly" :passedProps="{onClick: () => {onRemoveTemplate()}}" size="small" style="min-width: 200px;">Fjern mal</VTFKButton>
          </div>
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
          <upload-field v-model="dispatch.attachments" :disabled="isReadOnly" style="width: 100%" :downloadBaseUrl="`${$config.MASSEUTSENDELSEAPI_BASEURL}blobs/${dispatch._id}/`" :allowedExtensions="['pdf', 'xlsx', 'xls', 'rtf', 'msg', 'ppt', 'pptx', 'docx', 'doc', 'png', 'jpg', 'jpeg']" />
          <div class="centeredColumn" style="margin-top: 1rem">
            <VTFKButton
              class="mt-1"
              :disabled="!dispatch.template || dispatch.template.template == undefined || !isRequiredTemplateDataFilledIn"
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
          matrikkelUnitsWithoutOwners: [],
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
            area: null,
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
        missingOwnersTableHeaders: [
          {
            text: 'Bruksnavn',
            value: 'bruksnavn'
          },
          {
            text: 'Type',
            value: '_type'
          },
          {
            text: 'Etableringsdato',
            value: 'etableringsdato'
          }
        ],
        // MatrikkelUnits where no owners are specified
        matrikkelUnitsWithoutOwners: [],
        // Ownerships where ownerid is empty
        ownershipsWithoutOwnerId: [],
        // The initial state of the dispatch (Used for not deactivating the save button when approving)
        initialDispatchStatus: undefined,
        // The file provided by the fileuploader
        uploadedFile: undefined,
        // The templates received from the API
        templates: [],
        // The selected template in the template picker
        selectedTemplate: undefined,
        // The generated schema after picking a template
        selectedTemplateSchema: undefined,
        matrikkelLoadingMessage: '',
        matrikkelLoadingSubmessage: '',
        matrikkelLoadingSubSubMessage: '',
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
      }
    },
    computed: {
      isAllRequiredMatrikkelInfoRetreived() {
        const m = this.dispatch.stats;
        if(m.affectedCount !== null && m.totalOwners !== null) {
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
        if((!this.dispatch.template || !this.dispatch.template._id) && (!this.dispatch.attachments || !Array.isArray(this.dispatch.attachments) || this.dispatch.attachments.length === 0)) return false;
        if(this.mode === 'new' && (!this.isDispatchApproved || !this.isMatrikkelApproved)) return false;
        return true;
      },
      statsCards() {
        if(!this.dispatch.stats) return undefined;
        
        let cards = [];
        if(this.dispatch.stats.affectedCount) cards.push({ text: 'Enheter', value: this.dispatch.stats.affectedCount });
        if(this.dispatch.stats.totalOwners ) cards.push({ text: 'Alle eiere', value: this.dispatch.stats.totalOwners });
        if(this.dispatch.stats.businessOwners) cards.push({ text: 'Juridiske eiere', value: this.dispatch.stats.businessOwners });
        if(this.dispatch.stats.privateOwners) cards.push({ text: 'Private eiere', value: this.dispatch.stats.privateOwners });

        return cards;
      },
      templateParagraph() {
        // Not the pretties solution, but just had to get it done
        return this.dispatch.template?.data?.info?.paragraph || undefined
      }
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
                matrikkelUnitsWithoutOwners: [],
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
        }
      },
      updateParagraph(text) {
        if(!this.dispatch.template.data) this.dispatch.template.data = {};
        if(!this.dispatch.template.data.info) this.dispatch.template.data.info = {};
        this.dispatch.template.data.info.paragraph = text;
      },
      reset(force = false) {
        // Validation
        if(force === false && !confirm('Er du helt sikker på at du vil starte på nytt?')) return;

        // Set the data back to the baseline
        Object.assign(this.$data, this.reInitialState());

        // Action states
        this.state = 'initial';
        this.isParsingFile = false;
        this.isContactingMatrikkel = false;

        // Data
        this.uploadedFile = undefined;
        this.error = undefined;
      },
      openUrl(url) {
        if(!url) return;
        window.open(url, '_blank');
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
            let ids = await matrikkelClient.getMatrikkelEnheterFromPolygon(polygon.vertices, polygon.EPSG, { query: { flatten: true, metadata: false } });
            // Add any ids that don't already exists
            for(const id of ids) {
              if(!matrikkelEnhetIds.includes(id)) matrikkelEnhetIds.push(id);
            }
          }
          if(!matrikkelEnhetIds || matrikkelEnhetIds.length === 0) {
            throw new AppError('Ingen MatrikkelIDer funnet', 'Vi klarte ikke å finne noen matrikkelinformasjon innenfor dette polygonet');
          }

          /*
            Create batches of the id's and retreive data for each batch
          */
          const batchSize = 100;
          const batches = matrikkelEnhetIds.reduce((resultArray, item, index) => { 
            const chunkIndex = Math.floor(index/batchSize)
            if(!resultArray[chunkIndex]) {
              resultArray[chunkIndex] = [] // start a new chunk
            }
            resultArray[chunkIndex].push(item)
            return resultArray
          }, [])
          if(!batches || batches.length === 0) throw new AppError('Problemer med å lage jobber', 'Vi klarte ikke å dele matrikkelIDene inn i mindre jobber');

          let batchIndex = 0;                 // Keeps track of what bach is currently beeing worked on
          let retreivedOwnerIds = [];         // Array of all the ownerIds that has already been retreived, used for optimizing not retreiving the same owners multiple times
          let retreivedOwners = [];           // Array that stores all the retreived owners3
          let retreivedMatrikkelUnits = [];   // Matrikkel
          for(const batch of batches) {
            this.matrikkelLoadingMessage = `Utfører jobb ${batchIndex + 1} av ${batches.length}`

            // Lag ett request for å kontakte store-service for informasjon om IDene
            let matrikkelEnhetRequestItems = [];
            batch.forEach((item) => {
              matrikkelEnhetRequestItems.push({
                type: 'MatrikkelenhetId',
                namespace: 'http://matrikkel.statkart.no/matrikkelapi/wsapi/v1/domain/matrikkelenhet',
                value: item
              })
            })

            // Hent ut data for alle matrikkel enhetene
            this.matrikkelLoadingSubmessage = `Innhenter informasjon om ${batch.length} Matrikkelenheter`;
            let matrikkelEnheter = await matrikkelClient.getStoreItems(matrikkelEnhetRequestItems);

            // Håndter feil
            if(!matrikkelEnheter || batch.length === 0) {
              throw new AppError('Ingen MatrikkelEnheter funnet', 'Vi klarte ikke å finne noen matrikkelinformasjon for de ' + matrikkelEnhetIds.length + ' idene');
            } else if (batch.length > matrikkelEnheter.length) {
              let deviation = batch.length - matrikkelEnheter.length;
              let notFoundIDs = [];
              matrikkelEnhetIds.forEach((id) => {
                let match = matrikkelEnheter.find((m) => m.id === id);
                if(!match) { notFoundIDs.push(id); }
              })
              throw new AppError('Færre matrikkel enheter er returnert', 'MatrikkelAPIet returnerte ' + deviation + ' færre enheter enn det vi etterspurte \n' + notFoundIDs);
            }
            else if(matrikkelEnheter.length > batch.length) {
              throw new AppError('For mange matrikkelenheter er returnert', 'Vi fant ' + matrikkelEnheter.length + ' IDer, men skulle kun hatt ' + batch.length + '.');
            }

            /*
              Hent ut alle eierforhold innad for MatrikkelEnhetene
            */
            let matrikkelEierforhold = []
            matrikkelEnheter.forEach((enhet) => {
              // If the eierforhold is empty
              if(!enhet.eierforhold) {
                this.dispatch.matrikkelUnitsWithoutOwners.push(enhet);
                return;
              }

              // Convert the eierforhold to array if it is just an object
              if(!Array.isArray(enhet.eierforhold)) enhet.eierforhold = [enhet.eierforhold];

              // Remove any owners that does not have an eierId
              let ownershipIdsToRemove = [];
              enhet.eierforhold.forEach((ownership) => {
                if(!ownership.eierId) {
                  this.ownershipsWithoutOwnerId.push(ownership);
                  ownershipIdsToRemove.push(ownership.id);
                }
              })
              enhet.eierforhold = enhet.eierforhold.filter((o) => !ownershipIdsToRemove.includes(o.id))

              // If the ownerships
              if(enhet.eierforhold.length > 0) {
                enhet.eierforhold.forEach((eierforhold) => {
                  matrikkelEierforhold.push(eierforhold)
                })
              } else {
                this.dispatch.matrikkelUnitsWithoutOwners.push(enhet);
              }
              retreivedMatrikkelUnits.push(enhet);
            })

            /*
              Hent ut alle eier-informasjon for hver av eierforholdene
            */
            // Finn all unike eier IDer i alle eierforholdene
            let unikeEierIDer = [];
            matrikkelEierforhold.forEach((eierforhold) => {
              if(!retreivedOwnerIds.find((id) => id === eierforhold.eierId)) {
                unikeEierIDer.push(eierforhold.eierId);
                retreivedOwnerIds.push(eierforhold.eierId);
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
            this.matrikkelLoadingSubmessage = `Innhenter informasjon om ${unikeEierIDer.length} eiere av ${batch.length} matrikkelenheter`;
            this.matrikkelLoadingSubSubMessage = 'Dette steget tar tid. Matrikkelen, Brønnøysund og Folkeregisteret kontaktes for hver eier'
            let matrikkelEiere = await matrikkelClient.getStoreItems(matrikkelEierRequestItems);

            if(!matrikkelEiere || matrikkelEiere.length === 0) {
              throw new AppError('Ingen eiere er funnet', 'Vi spurte matrikkelen om ' + matrikkelEierRequestItems.length + ' eiere, men fikk ingen tilbake');
            } else if(matrikkelEierRequestItems.length > matrikkelEiere.length) {
              throw new AppError('Ingen eiere er funnet', 'Vi spurte matrikkelen om ' + matrikkelEierRequestItems.length + ' eiere, men fikk kun ' + matrikkelEiere.length + ' tilbake');
            }

            retreivedOwners.push(...matrikkelEiere);
            batchIndex++;
          }

            /*
              Generer ett datasett hvor eiere er først med alle eierforhold under
            */
            let ownerCentric = MatrikkelProxyClient.getMatrikkelEnheterOwnerCentric(retreivedMatrikkelUnits, retreivedOwners);

            /*
              Exclude owner that should not be contacted
            */
            let excludedOwners = [];
            
            // Exculde owners
            for(let owner of ownerCentric) {
              let excludedReason = undefined;
              // Manually handle (Adresse sperre)
              if(owner.dsf) {
                const spesCode = parseInt(owner.dsf['SPES-KD'])
                const statCode = parseInt(owner.dsf['STAT-KD'])
                if(statCode) {
                  if(statCode === 3) {
                    excludedReason = 'Utvandret';
                    owner.isHardExcluded = true;
                  }
                  if(statCode === 4) {
                    excludedReason = 'Forsvunnet';
                    owner.isHardExcluded = true;
                  }
                  if(statCode === 5) {
                    excludedReason = 'Død';
                    owner.isHardExcluded = true;
                  }
                }
                if(spesCode && (spesCode === 4 || spesCode === 6 || spesCode === 7)) {
                  excludedReason = 'Må håndteres manuelt';
                  owner.isHardExcluded = true;
                }
              }

              // Handle manually
              if(owner.manuallyHandle === true || owner.handleManually === true) {
                excludedReason = 'Må håndteres manuelt';
                owner.isHardExcluded = true;
              }

              // Utvandret
              if(owner.utvandret) {
                excludedReason = 'Utvandret';
                owner.isHardExcluded = true;
              }

              // Forsvunnet
              if(owner.forsvunnet) {
                excludedReason = 'Forsvunnet';
                owner.isHardExcluded = true;
              }

              // Dead owners
              if((owner.dead === true) || (owner && owner.name && owner.name.includes('DØDSBO'))) {
                excludedReason = 'Død';
                owner.isHardExcluded = true;
              }

              // Pre-excluded person or org numbers
              if(config.EXCLUDED_OWNER_IDS && Array.isArray(config.EXCLUDED_OWNER_IDS) && config.EXCLUDED_OWNER_IDS.includes(owner.nummer)) {
                excludedReason = 'Forhåndsekskludert';
              }

              if(owner.avviklet) {
                excludedReason = 'Firma er avviklet'
                owner.isHardExcluded = true;
              }

              if(owner._type?.toLowerCase().includes('juridisk') && !owner.brreg) {
                excludedReason = 'Finnes ikke i Brønnøysund'
                owner.isHardExcluded = true;
              }

              if(excludedReason) {
                owner.exclusionReason = excludedReason;
                excludedOwners.push(owner);
              }

            if(excludedOwners.length !== 0) {
              let excludedIds = excludedOwners.map((o) => o.nummer);
              ownerCentric = ownerCentric.filter((o) => !excludedIds.includes(o.nummer));
            }
          }

          // Hent ut juridiske eiere
          let juridiskeEiere = retreivedOwners.filter((e) => e._type.toLowerCase().includes('juridisk'));

          /*
            Handle statistics
          */
          // Assign values to the dispatch object
          this.dispatch.stats.affectedCount = retreivedMatrikkelUnits.length;
          this.dispatch.stats.privateOwners = retreivedOwners.length - juridiskeEiere.length;
          this.dispatch.stats.businessOwners = juridiskeEiere.length;
          this.dispatch.stats.totalOwners = retreivedOwners.length;
          // this.dispatch.stats.area = this.dispatch.polygons.area;

          if(!this.dispatch.matrikkelEnheter) this.dispatch.matrikkelEnheter = [];
          if(!this.dispatch.excludedOwners) this.dispatch.excludedOwners = [];
          this.dispatch.owners.push(...ownerCentric);
          this.dispatch.excludedOwners.push(...excludedOwners);

          this.isContactingMatrikkel = false;
        } catch(err) {
          console.error(err);
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
          if(!files || !Array.isArray(files) || files.length === 0) return;
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
        // TODO Sette en timestamp på når utsendelsen vil gå til p360
        if(this.dispatch.status === 'approved'){
          if(!confirm(`Er du helt sikker på at du vil lagre?\n\nStatus er nå satt til "Godkjent", dette betyr at du vil sende ut brev til totalt: ${this.dispatch.stats.totalOwners} eiere.\nAv disse er ${this.dispatch.stats.businessOwners} juridiske eiere og ${this.dispatch.stats.privateOwners} private eiere.\n\nUtsendelsen vil bli sendt til arkivering og bli sendt til ${this.dispatch.stats.totalOwners} mottakere.\nUtsendelsen vil skje påfølgende dag mellom kl 12.00 og kl 13.00.`)) return;
        }
        else{
          if(!confirm('Er du helt sikker på at du vil sende inn?')) return;
        }

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
          console.log('Error while saving dispatch');
          console.log(err);
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
        if(this.dispatch.template?.data) {
          // Get all the properties that exists in the schema
          const matchingKeys = pick(this.dispatch.template.data, [...Object.keys(templateData), 'info']);
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
      getMatchingTemplate() {
        if(!this.dispatch.template || !this.dispatch.template._id) return undefined;
        if(!this.templates) return undefined;
        
        let match = this.templates.find((t) => t._id === this.dispatch.template._id);

        if(match) return match;
        return undefined;
      },
      onRemoveTemplate() {
        if(!confirm('Er du helt sikker på at du vil fjerne malen?')) return;

        this.selectedTemplate = undefined;
        this.selectedTemplateSchema = undefined;
        this.dispatch.template = {};
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
        if(this.dispatch.template?.template) {
          let sameTemplate = this.$store.state.templates.find((t) => t._id === this.dispatch.template._id)
          if(sameTemplate) this.onTemplateChanged(sameTemplate);
          else this.onTemplateChanged(this.dispatch.template);
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