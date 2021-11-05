<template>
  <div style="text-align: left; align-items: flex-start;">
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
    <h2 style="margin-top: 2rem;">Hovedmal</h2>
    <p>Dette er dokumentmalen som omberammer denne innholdsmalen<p>
    <VSelect
      v-model="activeTemplate.mainTemplate.id"
      :items="mainTemplates"
      label="Hovedmal"
      hint="Dette er hovedmalen som omfavner innholdet i denne innholdsmalen"
      persistent-hint
      item-text="label"
      @change="onMainTemplateChanged()"
      style="justify-content: flex-start!important;"
    />
    <!-- Dyanamic template -->
    <div v-if="flattenedMainTemplateSchema">
      <h3>Felter i hovedmalen</h3>
      <p>Hovedmalen har noen dynamiske felter, hva som skal stå i disse kan du sette her</p>
        <div v-for="(schema, i) in flattenedMainTemplateSchema" :key="i" style="margin-top: 0.5rem;">
          <VTextField 
            v-if="schema.type === 'text'"
            :value="schema.default || ''"
            :placeholder="schema.label"
            :label="schema.label"
            @input="(e) => { updatemainTemplate(schema.path, e) }"
            :required="true"
          />
        </div>
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
import set from 'lodash.set';
import get from 'lodash.get';
import axios from 'axios';
import { Editor } from '@toast-ui/vue-editor';
import { Button, TextField, PDFPreviewModal } from '@vtfk/components';

/*
  Template client
*/
class TemplateClient {
  /*
    Regex expressions
  */
  static generalPlaceholderRegex = /({{.+?}})/gm
  static v1PlaceholderRegex = /{{\s*(\w+\.?)+?\s*}}/gm
  static v2PlaceholderRegex = /({{.+?=".+?"}})/gm

  static parsePlaceholderString(markdown) {
    // Input validation
    if(!markdown || !markdown.startsWith('{{') || !markdown.endsWith('}}')) { return; }

    // Remove the  {{ }}
    let p = markdown.substring(2, markdown.length - 2);

    // Split the text
    let split = p.split(':');

    // Get all the placeholder properties
    let placeholder = {};
    if(markdown.match(this.v1PlaceholderRegex)) {
      // Version 1 - Only path
      placeholder.v = 1;
      p = p.trim();

      let pathSplit = p.split('.');

      let label='';
      pathSplit.forEach((part) => label += part.charAt(0).toUpperCase() + part.slice(1))
      
      placeholder.label = label;
      placeholder.path = p;
    } else if(markdown.match(this.v2PlaceholderRegex)) {
      // Version 2
      placeholder.v = 2;
      split.forEach((kvp) => {
        if(!kvp.includes('=')) { return }

        const type = kvp.split('=')[0];
        let value = kvp.split('=')[1];

        if(value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }

        placeholder[type.toLowerCase()] = value;
      })
    } else {
      return;
    }
    
    // Validate that requred fields are present
    if(!placeholder.label) { throw new Error('Placeholder does not contain label: ' + markdown); }
    if(typeof placeholder.label !== 'string') { throw new Error('Placeholder label is not a string: ' + markdown); }
    if(!placeholder.path) { throw new Error('Placeholder does not contain a path: ' + markdown); }
    if(typeof placeholder.path !== 'string') { throw new Error('Placeholder path is not a string: ' + markdown); }

    // Set default values
    placeholder.type = placeholder.type || 'text';
    
    // Return the parsed placeholder object
    return placeholder;
  }

  static getPlaceholdersFromString(text) {
    // Input validation
    if(!text) { return []; }

    // Check that there are placeholders
    let placeholders = text.match(this.generalPlaceholderRegex);
    if(!placeholders || (Array.isArray(placeholders) && placeholders.length === 0)) { return []; }

    // Enumurate through all placeholders and parse them
    let parsedPlaceholders = [];
    placeholders.forEach((p) => {
      let parsed = this.parsePlaceholderString(p);

      if(parsed) { parsedPlaceholders.push(parsed); }
    })
    console.log(parsedPlaceholders);
    return parsedPlaceholders;
  }

  static generateSchemaFromMarkdown(markdown) {
    // Input validation
    if(!markdown) { throw new Error('Markdown was not provided'); }

    // Retreive all placeholders from the markdown
    const placeholders = this.getPlaceholdersFromString(markdown);

    // Generate the schema
    let schema = {};
    placeholders.forEach((p) => {
      if(!p.path) { return; }
      set(schema, p.path, p)
    })

    // Return the schema
    return schema;
  }

  /**
   * Replaces all placeholders in the text with data from the dataobject
   * @param {string} text A text string with placeholders
   * @param {object} data A javascript object that matches the placeholders
   * @param {bool} preview Should preview data be used where applicable?
   */
  static replacePlaceholdersInText(text, data, preview=false) {
    // Input validation
    if(!text || !data) { return text; }

    // Get all v2 placeholders
    let placeholders = text.match(this.v2PlaceholderRegex);

    // Replace all the placeholders
    placeholders.forEach((p) => {
      // Parse the placeholder
      let placeholder = this.parsePlaceholderString(p);
      if(!placeholder) { return; }

      // Split the text on the placeholder
      let parts = text.split(p);

      // Determine what to replace the data with
      let replaceWith = '';
      let value = get(data, placeholder.path);
      if(value !== undefined) { replaceWith = value; }
      else if(placeholder.default) { replaceWith = placeholder.default; }
      else if(preview && placeholder.preview) { replaceWith = placeholder.preview; }
      else if(preview && placeholder.label) { replaceWith = placeholder.label; }

      // Reconstruct the text with the replacement value
      text = parts[0] + replaceWith + parts[1];
    })

    // Return the updated text
    return text;
  }
}

export default {
  name: 'TemplateEditor',
  components: {
    Editor,
    'VTFKButton': Button,
    'VTFKTextField': TextField,
    'VTFKPDFPreviewModal': PDFPreviewModal
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
      pdfPreview: undefined,
      hasChanged: false,
      activeTemplate: {},
      activeOptions: undefined,
      defaultOptions: {
        hideModeSwitch: this.$props.hideModeSwitch,
        language: 'no-NB',
        usageStatistics: false,
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr'],
          ['ul', 'ol', 'indent', 'outdent']
        ]
      },
      mainTemplates: [
        {
          label: 'Brevmal',
          value: 'brevmal',
          schema: {
            info: {
              'our-date': {
                label: 'Vår dato',
                type: 'text'
              },
              'our-reference': {
                label: 'Vår referanse',
                type: 'text'
              },
              paragraph: {
                label: 'Paragraf',
                type: 'text',
                default: 'Offl. § 13 jf. fvl. §13 (1)',
                required: true
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
    flattenedMainTemplateSchema() {
      // Input validation
      if(!this.mainTemplates) { return undefined; }
      if(!this.activeTemplate.mainTemplate.id) { return undefined; }
      
      // Get the schema
      let template = this.mainTemplates.find((i) => i.value == this.activeTemplate.mainTemplate.id);
      if(!template || !template.schema) { return undefined }
      const schema = template.schema;
      
      // Recursively flatten the schema
      let flatSchema = [];
      function flattenObject(obj, path) {
        if(typeof obj !== 'object') {
          return;
        }
        for(let key in obj) {
          if(obj[key].label !== undefined && obj[key].type !== undefined) {
            flatSchema.push({
              path: path === '' ? key : path + '.' + key,
              ...obj[key]
            })
          } else {
            flattenObject(obj[key], path === '' ? key : path + '.' + key)
          }
        } 
      }

      flattenObject(schema, '');

      return flatSchema;
    }
  },
  methods: {
    onChange() {
      this.hasChanged = true;
      this.editedMarkdown = this.$refs.editor.editor.getMarkdown();
      this.$set(this.activeTemplate, 'markdown', Buffer.from(this.$refs.editor.editor.getMarkdown()).toString('base64'));
      this.$emit('input', this.activeTemplate);
      this.$emit('onChange', this.activeTemplate);
    },
    updatemainTemplate(keyPath, value) {
      if(!keyPath || !value) { return; }
      set(this.activeTemplate.mainTemplate.data, keyPath, value);
      this.$set(this.activeTemplate.mainTemplate, 'data', this.activeTemplate.mainTemplate.data);
    },
    getmainTemplateSchema() {
      // Input validation
      if(!this.mainTemplates) { return undefined; }
      if(!this.activeTemplate.mainTemplate.id) { return undefined; }
      
      // Get the schema
      let template = this.mainTemplates.find((i) => i.value == this.activeTemplate.mainTemplate.id);
      if(!template || !template.schema) { return undefined }

      // Return the schema
      return template.schema;
    },
    onMainTemplateChanged() {
      // Get the main template schema
      const schema = this.getmainTemplateSchema();
      if(!schema) { return; }

      // Create a default object from a schema
      function createDefaultObjectFromSchema(currentSchemaObject, path, currentKey, finalObject) {
        // If the current key is not an objekt, just return
        if(typeof currentSchemaObject !== 'object') { return; }

        // Iterate through all keys
        for(let key in currentSchemaObject) {
          // If the key is not an object, just return
          if(typeof currentSchemaObject[key] !== 'object') { return; }
          // 
          const childObj = currentSchemaObject[key];
          const newPath = path === '' ? key : path + '.' + key;

          // If the key is a schema-entry with a default value, add it to the final object
          if(childObj['default'] !== undefined && childObj['default'] !== '') {
            finalObject[key] = currentSchemaObject[key].default;
            return;
          }
          
          // If the child has children, recursively step down and attempt to find more default values
          if(Object.keys(childObj).length > 0) {
            finalObject[key] = {}
            createDefaultObjectFromSchema(currentSchemaObject[key], newPath, key, finalObject[key])
            if(Object.keys(finalObject[key]).length <= 0) { delete finalObject[key]; }
          }
        }
        return finalObject;
      }
      
      // Generate the default object ad assign it to the object
      let defaultObject = createDefaultObjectFromSchema(schema, '', '', {})
      this.activeTemplate.mainTemplate.data = defaultObject;

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
          title: 'Tittel test'
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

      // Generate a schema
      const schema = TemplateClient.generateSchemaFromMarkdown(this.editedMarkdown);
      if(schema) {
        this.activeTemplate.schema = schema;
        this.$set(this.activeTemplate, 'schema', schema);
      }

      // TODO: Validering

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

        // Split markdown on placeholders
        let splitted = markdown.split(TemplateClient.v2PlaceholderRegex);

        if(splitted.length == 1) {
          return [
            { type: 'text', content: markdown },
          ]
        }

        let tags = [];
        splitted.forEach((part) => {
          // Check if the part matches the regex
          let match = part.match(TemplateClient.v2PlaceholderRegex);
          if(match) {
            try {
              // Attempt to parse the match
              let parsedPlaceholder = TemplateClient.parsePlaceholderString(part);
              tags.push(...[
                { type: 'openTag', tagName: 'span', classNames: ['placeholderChip']},
                { type: 'text', content: '[' + parsedPlaceholder.label + ']:' + parsedPlaceholder.type },
                { type: 'closeTag', tagName: 'span' },
              ])
              return;
            } catch { match = undefined; }
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
    this.editedMarkdown = this.activeTemplate.markdown.toString('utf8');
    this.activeTemplate.schema = this.activeTemplate.schema || {};
    this.activeTemplate.mainTemplate.id = this.activeTemplate.mainTemplate.id || 'brevmal';
    this.activeTemplate.mainTemplate.language = this.activeTemplate.mainTemplate.language || 'nb';
    this.activeTemplate.mainTemplate.data = this.activeTemplate.mainTemplate.data || {};
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
</style>