<template>
  <div class="container">
    <Error v-if="error" :error="error" />
    <Loading v-else-if="isLoading" title="Laster maler" />
    <div v-else>
      <VDataTable :items="templates" :headers="tableHeaders">
        <template v-slot:top>
          <VToolbar flat>
            <v-toolbar-title>Maler</v-toolbar-title>
            <v-divider class="mx-4" inset vertical />
            <v-spacer />
            <VTFKButton>Ny mal</VTFKButton>
          </VToolbar>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon medium @click="openTemplate(item)" >
                  mdi-file-find
                </v-icon>
              </v-btn>
            </template>
            Forhåndsvisning
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon medium @click="openTemplate(item)" >
                   mdi-pencil
                </v-icon>
              </v-btn>
            </template>
            Rediger
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon medium @click="openTemplate(item)" >
                   mdi-delete
                </v-icon>
              </v-btn>
            </template>
            Slett
          </v-tooltip>
        </template>
      </VDataTable>
      <!-- Modals -->
      <VDialog v-if="isShowEditor" v-model="isShowEditor" width="60%" style="text-align: left;">
        <VCard>
          <VCardTitle>
            Endre mal
          </VCardTitle>
          <VCardText>
            <TemplateEditor :template="activeTemplate" @close="reset()" />
          </VCardText>
        </VCard>
      </VDialog>
    </div>
  </div>
</template>

<script>
// Importer dependencies
import AppError from '../lib/vtfk-errors/AppError';
import axios from 'axios';

// Importer VTFK komponenter
import { Button } from '@vtfk/components';

// Importer prosjektkomponenter
import Loading from '../components/Loading.vue';
import TemplateEditor from '../components/TemplateEditor.vue';

export default {
  name: 'TemplatesView',
  components: {
    Loading,
    TemplateEditor,
    'VTFKButton': Button
  },
  data() {
    return {
      error: undefined,
      templates: [],
      unmodifiedTemplate: undefined,
      activeTemplate: undefined,
      tableHeaders: [
        {
          text: 'Navn',
          value: 'name'
        },
        {
          text: 'Beskrivelse',
          value: 'description'
        },
        {
          text: 'Handlinger',
          value: 'actions'
        }
      ],
      isLoading: true,
      isShowEditor: false,
      isShowPreview: false
    }
  },
  methods: {
    reset() {
      this.isLoading = false;
      this.isShowEditor = false;
      this.isShowPreview = false;
      this.activeTemplate = undefined;
    },
    loadTemplates() {
      let request = {
        url: 'https://NOE.no/api/v1/templates',
        mode: 'get',
      }

      this.isLoading = true;
      axios.request(request)
      .then((response) => {
        this.templates = response.data;
        this.isLoading = false;
      }).catch((err) => {
        this.error = new AppError('Kunne ikke hente hente inn maler', err);
      })
    },
    openTemplate(template) {
      this.unmodifiedTemplate = JSON.parse(JSON.stringify(template));
      this.activeTemplate = JSON.parse(JSON.stringify(template));
      this.isShowEditor = true;
    }
  },
  created() {
    this.loadTemplates();
  }
}
</script>

<style scoped>

</style>