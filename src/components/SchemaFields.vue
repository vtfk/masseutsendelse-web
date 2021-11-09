<template>
  <div style="width: 100%;">
  <Error v-if="error" :error="error" :showResetButton="false" />
    <!-- Inputs -->
    <div v-else v-for="(property, i) in schemaProperties" :key="i">
      <VTextField 
        v-if="property.type === 'string'"
        :value="getInitialData(property.path)"
        :placeholder="property.description || undefined"
        :hint="property.description || undefined"
        :label="determinePropertyLabel(property)"
        @input="(e) => updateData(property.path, e)"
        :required="true"
      />
    </div>
  </div>
</template>

<script>
// Importer dependencies
import AppError from '../lib/AppError';
import Sjablong from 'sjablong';
import get from 'lodash.get';
import set from 'lodash.set';
import merge from 'lodash.merge';

// Import components
import Error from './Error.vue';

export default {
  name: 'SchemaFields',
  components: {
    Error
  },
  props: {
    value: {
      type: Object,
      default: () => {return {}}
    },
    schema: {
      type: [Object, Array],
      required: true
    }
  },
  data() {
    return {
      error: undefined,
      schemaProperties: undefined,
      data: undefined
    }
  },
  created() {
    try {
      // Input validation
      if(!this.$props.schema) throw new AppError('Skjema mangler', 'Skjemakomponenten har ikke mottatt noe skjema');
      if(Array.isArray(this.$props.schema)) throw new AppError('Feil skjema type', 'Skjemaet er av typen array, det må være ett vanlig objekt');
      let schemaType = typeof this.$props.schema;
      if(schemaType !== 'object') throw new AppError('Feil skjema type', 'Skjemaet skal være av type object eller array, men er av type ' + schemaType);

      // Get the default data from the schema
      let defaultData = Sjablong.createObjectFromSchema(this.$props.schema);

      // Merge the provided data with the default data
      this.data = merge(this.$props.value, defaultData);

      // Emit to the parent that the data might have changed
      this.onUpdate();

      // Determine how to assign the flattened schema
      let flattenedSchema = Sjablong.flattenSchema(this.$props.schema);
      if(!flattenedSchema || !Array.isArray(flattenedSchema) || flattenedSchema.length <= 0) throw new AppError('Skjemaet er tomt', 'Skjema er mottatt, men vi finner ingen felter');
      
      // Set skjemaet
      this.schemaProperties = flattenedSchema;
    } catch (err) {
      this.setError(err);
    }
  },
  methods: {
    setError(err) {
      // Set error
      this.error = err;
      // Emit that an error has occures
      this.$emit('error', this.error);
    },
    updateData(path, value) {
      // Input validation
      if(!path || !value) return;
      // Set the value to the data object
      set(this.data, path, value);
      // Vue reactivity hack for objects
      this.$set(this, 'data', this.data);
      this.onUpdate();
    },
    onUpdate() {
      // Emit the updated data
      this.$emit('input', this.data);   // For v-model binding
      this.$emit('changed', this.data); // For other listening
    },
    getInitialData(path) {
      return get(this.data, path) || '';
    },
    determinePropertyLabel(property) {
      if(property.label) return property.label;
      if(property.path) return property.path; // TODO: Gjør om

      return 'Ukjent...'
    }
  }
}
</script>

<style scope>

</style>