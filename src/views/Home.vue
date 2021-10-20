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
    <div class="mt-1">
      <DispatchEditor />
    </div>
  </div>
</template>

<script>
  // VTFK komponenter
  import { Button } from '@vtfk/components'

  // Prosjektkomponenter
  import GuideBtnModal from '../components/GuideBtnModal.vue'
  import DispatchEditor from '../components/DispatchEditor.vue';

  // Import libraries
  import MatrikkelProxyClient from '../lib/matrikkelProxyClient'
  import DxfParser from 'dxf-parser'
  import proj4 from 'proj4';

  // Error klasse
  import AppError from '../lib/AppError';

  export default {
    name: 'HomeView',
    components: {
    'VTFKButton': Button,
    GuideBtnModal,
    DispatchEditor
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
      isParsingFile: false,
      isMatrikkelApproved: false,
      isFirstLevelDispatchApproved: false,
      hasLoadedFile: false,
      isContactingMatrikkel: false,
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
      error: undefined
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
    },
    mode() {
      if(!this.dispatch || this.dispatch.id === undefined) { return 'new'; }
      return 'edit';
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

        let arrayifiedVertices = [];
        let transformedVertices = [];
        // let firstLatitude = vertices[0].y;
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

        let center = {
          x: (lowX + highX) / 2,
          y: (lowY + highY) / 2
        }

        // Calculate midpoint
        let transformedCenter = proj4('EPSG:25832', 'EPSG:4326', JSON.parse(JSON.stringify(center)));

        // Calculate the coordinates for the outmost points
        /* eslint-disable */
        let translatedNorth = proj4('EPSG:25832', 'EPSG:4326', {x: northPoint.x , y: northPoint.y});
        let translatedWest = proj4('EPSG:25832', 'EPSG:4326', {x: westPoint.x , y: westPoint.y});
        let translatedEast = proj4('EPSG:25832', 'EPSG:4326', {x: eastPoint.x , y: eastPoint.y});
        let translatedSouth = proj4('EPSG:25832', 'EPSG:4326', {x: southPoint.x , y: southPoint.y});
        /* eslint-enable */

        // Set the polygon for the dispatch object
        this.dispatch.polygon.coordinatesystem = 'EUREF89 UTM Sone 32';
        this.dispatch.polygon.area = 100;
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
        this.dispatch.geopolygon.area = 100;
        this.dispatch.geopolygon.vertices = transformedVertices;
        this.dispatch.geopolygon.extremes = {
          north: [translatedNorth.y, translatedNorth.x],
          west: [translatedWest.y, translatedWest.x],
          east: [translatedEast.y, translatedEast.y],
          south: [translatedSouth.y, translatedSouth.x],
          center: [transformedCenter.y, transformedCenter.x]
        }


        // Kalkuler polygonets areal
        // TODO: Dette må finnes ut av
        this.dispatch.matrikkel.area = 100;

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
  }
}
</script>

<style scoped>

  

  

</style>