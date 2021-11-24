<template>
  <div class="container">
    <ErrorField v-if="error" :error="error" />
    <Loading v-else-if="!this.$store.state.templates" title="Laster maler" />
    <div v-else>
      <VDataTable :items="this.$store.state.templates" :headers="tableHeaders">
        <template v-slot:top>
          <VToolbar flat>
            <v-toolbar-title>Maler</v-toolbar-title>
            <v-divider class="mx-4" inset vertical />
            <v-spacer />
            <VTFKButton :passedProps="{ onClick: () => openTemplateEditor()}">Ny mal</VTFKButton>
          </VToolbar>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon medium @click="previewPDF(item)" >
                  mdi-file-find
                </v-icon>
              </v-btn>
            </template>
            Forhåndsvisning
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon medium @click="openTemplateEditor(item)" >
                   mdi-pencil
                </v-icon>
              </v-btn>
            </template>
            Rediger
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon medium @click="openTemplateEditor(item)" >
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
      isShowEditor: false,
      isShowPreview: false,
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
    }
  },
  methods: {
    reset() {
      this.isShowEditor = false;
      this.isShowPreview = false;
      this.activeTemplate = undefined;
    },
    async loadTemplates() {
      try {
        await this.$store.dispatch('getTemplates');
      } catch (err) {
        this.error = new AppError('Kunne ikke hente hente inn maler', err);
      }
    },
    openTemplateEditor(template) {
      if(template) this.activeTemplate = JSON.parse(JSON.stringify(template));
      else this.activeTemplate = {};
      
      this.isShowEditor = true;
    },
    previewPDF(template) {
      if(!template) { return; }

      let request = {
        preview: true,
        documentDefinitionId: template.documentDefinitionId,
        template: template.template,
        data: {...template.data }
      }

      this.$store.dispatch('getPDFPreview', request)
    }
  },
  created() {
    this.loadTemplates();
  }
}
</script>

<style scoped>

</style>