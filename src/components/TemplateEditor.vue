<template>
  <Error v-if="error" :error="error" :showResetButton="false" />
  <div v-else style="text-align: left; align-items: flex-start;">
    <h2>Generelt</h2>
    <p>Generell informasjon om malen</p>
    <VTFKTextField
      placeholder="Navn"
      :passedProps="{ onChange: (e) => { activeTemplate.name = e.target.value } }"
      :value="activeTemplate.name"
      style="margin-bottom: 0.5rem;"
    />
    <VTFKTextField
      placeholder="Beskrivelse"
      :passedProps="{ onChange: (e) => { activeTemplate.description = e.target.value } }"
      :value="activeTemplate.description"
      style="margin-bottom: 0.5rem;"
    />
    <h2 style="margin-top: 2rem;">Dokumentmal</h2>
    <p>Dette er dokumentmalen som omberammer denne innholdsmalen<p>
    <VSelect
      v-model="activeTemplate.documentTemplate.id"
      :items="documentTemplates"
      label="Hovedmal"
      hint="Dette er hovedmalen som omfavner innholdet i denne innholdsmalen"
      persistent-hint
      item-text="label"
      @change="onMainTemplateChanged()"
      style="justify-content: flex-start!important;"
    />
    <!-- Dyanamic template -->
    <div v-if="mainTemplateSchema">
      <h3>Felter i hovedmalen</h3>
      <p>Hovedmalen har noen dynamiske felter, hva som skal stå i disse kan du sette her</p>
        <SchemaFields v-model="activeTemplate.documentTemplate.data" :schema="mainTemplateSchema" @error="(e) => error = e" />
    </div>
    <h2 style="margin-top: 2rem;">Innholdsmal</h2>
    <p>Mal for innholdet i masseutsendelsene som skal sendes ut</p>
    <Editor
      :initialValue="editedMarkdown"
      ref="editor"
      :height="$props.height"
      initialEditType="markdown"
      :options="activeOptions"
      @change="(e) => { onChange(e) }"
      style="margin-top: 1rem;"
    />
    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
      <VTFKButton size="small" :passedProps="{ onClick: () => { onSaveTemplate(); }}">Lagre</VTFKButton>
      <VTFKButton size="small" :passedProps="{ onClick: () => { onPreviewTemplate(); }}">Forhåndsvisning</VTFKButton>
      <VTFKButton v-if="$props.showCloseButton" size="small" type="secondary" :passedProps="{ onClick: () => { close() } }">Lukk</VTFKButton>
    </div>
    <VTFKPDFPreviewModal :open="pdfPreview !== undefined" :base64="pdfPreview" title='Lukk modal' :passedProps="{ onDismiss: () => { pdfPreview = undefined; }}"/>
  </div>
</template>

<script>
import Error from './Error';
import axios from 'axios';
import { Editor } from '@toast-ui/vue-editor';
import { Button, TextField, PDFPreviewModal } from '@vtfk/components';
import Sjablong from 'sjablong';
import SchemaFields from './SchemaFields.vue';

export default {
  name: 'TemplateEditor',
  components: {
    Error,
    Editor,
    'VTFKButton': Button,
    'VTFKTextField': TextField,
    'VTFKPDFPreviewModal': PDFPreviewModal,
    SchemaFields
  },
  props: {
    template: {
      type: Object,
      default: () => {return {
        id: undefined,
        name: {},
        mainTemplate: {
          id: undefined,
          language: 'nb',
          data: undefined
        },
        markdown: '',
        schema: {}
      }}
    },
    options: {
      type: Object
    },
    hideModeSwitch: {
      type: Boolean,
      default: false
    },
    showCloseButton: {
      type: Boolean,
      default: true
    },
    height: {
      type: String,
      default: '500px'
    }
  },
  data() {
    return {
      error: undefined,
      pdfPreview: undefined,
      hasChanged: false,
      activeTemplate: {},
      activeOptions: undefined,
      defaultOptions: {
        hideModeSwitch: this.$props.hideModeSwitch,
        language: 'no-NB',
        usageStatistics: false,
        frontMatter: true,
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr'],
          ['ul', 'ol', 'indent', 'outdent']
        ]
      },
      documentTemplates: [
        {
          label: 'Brevmal',
          value: 'brevmal',
          schema: {
            type: 'object',
            properties: {
              info: {
                type: 'object',
                properties: {
                  'our-date': {
                    label: 'Vår dato',
                    type: 'string'
                  },
                  'our-reference': {
                    label: 'Vår referanse',
                    type: 'string'
                  },
                  paragraph: {
                    label: 'Paragraf',
                    type: 'string',
                    default: 'Offl. § 13 jf. fvl. §13 (1)',
                    required: true
                  }
                }
              }
            } 
          }
        },
        {
          label: 'Notatmal',
          value: 'notatmal'
        }
      ]
    }
  },
  computed: {
    mainTemplateSchema() {
      return this.getmainTemplateSchema() || undefined;
    },
  },
  methods: {
    onChange() {
      this.hasChanged = true;
      this.editedMarkdown = this.$refs.editor.editor.getMarkdown();
      this.$set(this.activeTemplate, 'markdown', Buffer.from(this.$refs.editor.editor.getMarkdown()).toString('base64'));
      this.$emit('input', this.activeTemplate);
      this.$emit('onChange', this.activeTemplate);
    },
    getmainTemplateSchema() {
      // Input validation
      if(!this.documentTemplates) { return undefined; }
      if(!this.activeTemplate.documentTemplate.id) { return undefined; }
      
      // Get the schema
      let template = this.documentTemplates.find((i) => i.value == this.activeTemplate.documentTemplate.id);
      if(!template || !template.schema) { return undefined }

      // Return the schema
      return template.schema;
    },
    onMainTemplateChanged() {
      // Get the main template schema
      const schema = this.getmainTemplateSchema();
      if(!schema) { return; }

      // Create a default data object
      let defaultData = Sjablong.createObjectFromSchema(schema);
      if(defaultData) this.activeTemplate.documentTemplate.data = defaultData;

      // Register the change
      this.onChange();
    },
    onPreviewTemplate() {
      // Hent markdown
      let markdown =  Buffer.from(this.$refs.editor.editor.getMarkdown()).toString('base64');
      
      axios.post('http://localhost:3001/api/v1/generatepdf', {
        preview: true,
        'template_data': markdown,
        data: {
          title: 'Tittel test',
          definition: 'brevmal',
          list: [
            'Item #1',
            'Item #2',
            'Item #3'
          ]
        }
      })
      .then((response) => {
        if(response.data && response.data.base64) {
          this.pdfPreview = response.data.base64;
        }
        // TODO - Håndter feil
      })
    },
    onSaveTemplate() {
      if(this.editedMarkdown == '' && !confirm('Malen er uten innhold, vil du fortsatt lagre?')) {
        return;
      }

      let valid = Sjablong.validateTemplate(this.editedMarkdown);
      console.log('Is template valid?');
      console.log(valid);

      // Generate a schema
      const schema = Sjablong.generateSchema(this.editedMarkdown);
      if(schema) {
        this.activeTemplate.schema = schema;
        this.$set(this.activeTemplate, 'schema', schema);
      }
      // TODO: Skriv til databasen

    },
    insertPlaceholder() {
      console.log('Inserting placeholder');
    },
    close() {
      if(this.hasChanged) {
        if(confirm('Noe er endret, er du sikker på at du vil lukke før du har lagret?')) {
          this.$emit('close');
        }
      }
      this.$emit('close');
    },
  },
  created() {
    this.activeOptions = this.$props.options || this.defaultOptions;
    this.activeOptions.customHTMLRenderer = {
      text(node) {
        if(!node.literal) return [{ type: 'text', content: '' }]
        let markdown = node.literal;

        // Split markdown on Sjablong entries
        let splitted = markdown.split(Sjablong.regexPatterns.sjablong.brackets);

        let tags = [];
        splitted.forEach((part) => {
          // Check if the part matches the regex
          let match = part.match(Sjablong.regexPatterns.sjablong.brackets);

          if(match) {
            try {
              let parsedPlaceholder = Sjablong.parsePlaceholder(part);
              tags.push(...[
                { type: 'openTag', tagName: 'span', classNames: ['placeholderChip']},
                { type: 'text', content: '[' + parsedPlaceholder.label + ']' },
                { type: 'closeTag', tagName: 'span' },
              ])
              return;
            } catch {
              tags.push(...[
              { type: 'openTag', tagName: 'span', classNames: ['incompletePlaceholderChip']},
              { type: 'text', content: '[Uferdig]' },
              { type: 'closeTag', tagName: 'span' },
            ])
            return;
            }
          }

          tags.push(...[
            { type: 'openTag', tagName: 'span'},
            { type: 'text', content: part },
            { type: 'closeTag', tagName: 'span' },
          ])
        })
        return tags
      }
    }
    this.activeTemplate = JSON.parse(JSON.stringify(this.$props.template));
    // Decode the base64 markdown to utf8
    if(this.activeTemplate.template && typeof this.activeTemplate.template === 'string') {
      this.editedMarkdown = Buffer.from(this.activeTemplate.template, 'base64').toString('utf8');
    }
    // Set other default values
    this.activeTemplate.schema = this.activeTemplate.schema || {};
    this.activeTemplate.documentTemplate.id = this.activeTemplate.documentTemplate.id || 'brevmal';
    this.activeTemplate.documentTemplate.language = this.activeTemplate.documentTemplate.language || 'nb';
    this.activeTemplate.documentTemplate.data = this.activeTemplate.documentTemplate.data || {};
  },
  mounted() {
    this.$refs.editor.editor.addCommand('markdown', 'insertPlaceholder', () => {
      console.log('Legger til!!');
      this.$refs.editor.editor.insertText('$$vtfk\nJadda');
      
    })
    this.$refs.editor.editor.addCommand('wysiwyg', 'insertPlaceholder', () => {
      console.log('Legger til!!');
      this.$refs.editor.editor.insertText('$$vtfk\nJadda');
      const md = this.$refs.editor.editor.getMarkdown();
      this.$refs.editor.editor.setMarkdown(md);
    })
    this.$refs.editor.editor.insertToolbarItem({}, {
      name: 'myItem',
      tooltip: 'Lag utfyllingsfelter',
      command: 'insertPlaceholder',
      text: '📝',
      className: 'toastui-editor-toolbar-icons first',
      style: { backgroundImage: 'none' }
    });
    this.$refs.editor.editor.insertToolbarItem({}, {
      name: 'myItem',
      tooltip: 'Matrikkel flettefelter',
      command: 'bold',
      text: '🗺️',
      className: 'toastui-editor-toolbar-icons first',
      style: { backgroundImage: 'none' }
    });
  }
}
</script>

<style>
  .placeholderChip {
    cursor: pointer;
    border: 1px solid #5a9491;
    background-color: #B4DCDA;
    border-radius: 8px;
    font-weight: bold;
    margin-left: 0.05rem;
    margin-right: 0.05rem;
    padding: 0.08rem 0.5rem;
  }

  .incompletePlaceholderChip {
    cursor: pointer;
    border: 1px solid #F3B5B2;
    background-color: #E7827E;
    font-weight: bold;
    border-radius: 8px;
    margin-left: 0.05rem;
    margin-right: 0.05rem;
    padding: 0.08rem 0.5rem;
  }
</style>