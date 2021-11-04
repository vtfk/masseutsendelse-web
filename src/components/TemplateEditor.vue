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
      :initialValue="activeTemplate.markdown"
      ref="editor"
      :height="$props.height"
      initialEditType="markdown"
      :options="activeOptions"
      @change="(e) => { onChange(e) }"
      style="margin-top: 1rem;"
    />
    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
      <VTFKButton size="small" :passedProps="{ onClick: () => { onSaveTemplate(); }}">Lagre</VTFKButton>
      <VTFKButton size="small">Forhåndsvisning</VTFKButton>
      <VTFKButton v-if="$props.showCloseButton" size="small" type="secondary" :passedProps="{ onClick: () => { close() } }">Lukk</VTFKButton>
    </div>
  </div>
</template>

<script>
import set from 'lodash.set';
import { Editor } from '@toast-ui/vue-editor';
import { Button, TextField } from '@vtfk/components';
import AppError from '../lib/AppError';

/*
  Template client
*/
class TemplateClient {
  static generalPlaceholderRegex = /({{.+?}})/gm
  static strictPlaceholderRegex = /({{.+?=".+?"}})/gm

  static parsePlaceholderString(markdown) {
    // Get one or more placeholders from the string
    const placeholders = markdown.match(this.strictPlaceholderRegex);


    return placeholders;
  }
  static getPlaceholdersFromString(text) {
    // Check that there are placeholders
    let placeholders = text.match(this.strictPlaceholderRegex);
    if(!placeholders) { return undefined; }
    console.log('Found placeholders');
    console.log(placeholders);
    return placeholders;
  }
}

/*
  ToastUI placeholder plugin
*/
function vtfkPlaceholderPlugin() {
  const toHTMLRenderers = {
    text(node) {
      if(!node.literal) return [{ type: 'text', content: '' }]

      let markdown = node.literal;

      // Split markdown on placeholders
      let splitted = markdown.split(TemplateClient.strictPlaceholderRegex);

      if(splitted.length == 1) {
        return [
          { type: 'text', content: markdown },
        ]
      }

      let tags = [];
      splitted.forEach((part) => {
        if(part.match(TemplateClient.strictPlaceholderRegex)){
          tags.push(...[
            { type: 'openTag', tagName: 'span', classNames: ['placeholderChip']},
            { type: 'text', content: '[PLACEHOLDER]' },
            { type: 'closeTag', tagName: 'span' },
          ])
        } else {
          tags.push(...[
            { type: 'openTag', tagName: 'span'},
            { type: 'text', content: part },
            { type: 'closeTag', tagName: 'span' },
          ])
        }
      })

      // console.log('Tags');
      // console.log(tags);

      return tags
    }
  }
  return { toHTMLRenderers }
}

  // const toHTMLRenderers = {
  //   text() {
  //     const tags = [
  //       { type: 'openTag', tagName: 'span'},
  //       { type: 'text', content: 'Text before placeholder' },
  //       { type: 'closeTag', tagName: 'span' },
  //       { type: 'openTag', tagName: 'span', classNames:["placeholderChip"]},
  //       { type: 'text', content: '[PLACEHOLDER]', onClick: () => { alert('test'); } },
  //       { type: 'closeTag', tagName: 'span' },
  //       { type: 'openTag', tagName: 'span'},
  //       { type: 'text', content: 'Text after placeholder' },
  //       { type: 'closeTag', tagName: 'span' },
  //     ]
  //     return tags
  //   }
  // }
  // return { toHTMLRenderers }



export default {
  name: 'TemplateEditor',
  components: {
    Editor,
    'VTFKButton': Button,
    'VTFKTextField': TextField,
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
      default: '200px'
    }
  },
  data() {
    return {
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
        ],
        plugins: [ vtfkPlaceholderPlugin ]
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
      this.$set(this.activeTemplate, 'markdown', this.$refs.editor.editor.getMarkdown());
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
    getPlaceholdersFromString(markdown) {
      const placeholderRegex = /{{.+}}/gm

      let placeholders = markdown.match(placeholderRegex);

      return placeholders;
    },
    onSaveTemplate() {
      if(this.activeTemplate.markdown == '' && !confirm('Malen er uten innhold, vil du fortsatt lagre?')) {
        return;
      }

      // Get all placeholders from the markdown
      const placeholders = this.getPlaceholdersFromString(this.activeTemplate.markdown);
      console.log('Placeholders');
      console.log(placeholders);

      if(placeholders && Array.isArray(placeholders)) {
        // Create a schema entry for each placeholder
        let schema = {};
        let placeholderErrors = [];
        placeholders.forEach((placeholder) => {
          // Valider at utfyllingsfeltet inneholder en label
          if(!placeholder.includes(':')) {
            placeholderErrors.push({
              placeholder: placeholder,
              label: 'Malformated placeholder',
              message: 'The placeholder does not contain ":"'
            })
            return;
          }

          // Strip away the {{ }}
          let p = placeholder.substring(2, placeholder.length - 2);
          // Split the text
          let split = p.split(':');

          if(split.length < 2) {
            placeholderErrors.push({
              placeholder: placeholder,
              label: 'Malformated placeholder',
              message: 'Utfyllingsfeltet inneholder under 2 felter'
            })
            return;
          }

          let schemaEntry = {};
          split.forEach((kvp) => {
            if(!kvp.includes('=')) { return }

            const type = kvp.split('=')[0];
            const value = kvp.split('=')[1];

            switch(type.toLowerCase()) {
              case 'label':
                schemaEntry.label = value;
                break;
              case 'type':
                schemaEntry.type = value;
                break;
              case 'path':
                schemaEntry.path = value;
                break;
              case 'description':
                schemaEntry.description = value;
                break;
              case 'default':
                schemaEntry.description = value;
                break;
            }

          })

          if(!schemaEntry.label) {
            placeholderErrors.push({ placeholder: placeholder, label: 'Malformated placeholder', message: 'Utfyllingsfeltet inneholder ikke en label-attributt'})
            return;
          }
          if(!schemaEntry.path) {
            placeholderErrors.push({ placeholder: placeholder, label: 'Malformated placeholder', message: 'Utfyllingsfeltet inneholder ikke en path-attributt'})
            return;
          }
          schemaEntry.type = schemaEntry.type || 'text';

          set(schema, schemaEntry.path, schemaEntry)
        })

        if(placeholderErrors && placeholderErrors.length > 0) {
          throw new AppError('Error validating placeholder', 'Det ble oppdaget en eller flere feil under validering av utfyllingsfelter ' + placeholderErrors.toString());
        }
        
        console.log('Schema');
        console.log(schema);

        this.activeTemplate.schema = schema;
        this.$set(this.activeTemplate, 'schema', schema);
      }
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
    this.activeTemplate = JSON.parse(JSON.stringify(this.$props.template));
    this.activeTemplate.markdown = this.activeTemplate.markdown || '';
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
    border: 1px solid black;
    background-color: #B4DCDA;
    border-radius: 20px;
    font-weight: bold;
    margin-left: 0.2rem;
    margin-right: 0.2rem;
    padding: 0.2rem 0.5rem;
  }
</style>