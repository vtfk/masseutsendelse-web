<template>
  <VCard style="text-align: left!important;">
    <VCardTitle>Legg till flettefelt</VCardTitle>
    <v-card-subtitle>Her kan du legge til ett felt som må fylles ut for å benytte malen</v-card-subtitle>
    <v-card-text>
      <ErrorField v-if="error" :error="error" :showResetButton="false" />
      <v-text-field v-model="placeholder.label" label="Navn" hint="Navn på feltet">
        <template #label>
          <span style="color: red"><strong>* </strong></span>Navn
        </template>
      </v-text-field>
      <v-text-field v-model="placeholder.description" label="Beskrivelse" hint="Beskrivelse av hva man skal fylle inn">
        <template #label>
          <span style="color: red"><strong>* </strong></span>Beskrivelse
        </template>
      </v-text-field>
      <v-select
        v-model="type"
        label="Type"
        hint="Hvordan type felt skal dette være?"
        :items="types"
        style="text-align: left!important;"
        @change="onChangeType()"
      >
        <template #label>
          <span style="color: red"><strong>* </strong></span>Type
        </template>
      </v-select>
      <v-text-field v-if="type === 'multistring'" v-model="placeholder.lines" type="number" label="Antall linjer" hint="Hvor mange linjer med tekst ønsker du?"/>
    </v-card-text>
    <v-card-actions style="gap: 0.5rem;">
      <VTFKButton size="small" :passedProps="{ onClick: () => { onInsert()}}">Legg til</VTFKButton>
      <VTFKButton size="small" :passedProps="{ onClick: () => { $emit('input', false) }}">Lukk</VTFKButton>
    </v-card-actions>
  </VCard>
</template>

<script>
// Import VTFK Component
import { Button } from '@vtfk/components';
import AppError from '../../lib/vtfk-errors/AppError';

export default {
  name: 'InsertTemplateForm',
  components: {
    'VTFKButton': Button
  },
  data() {
   return {
      error: '',
      placeholder: {
        label: undefined,
        type: 'string',
        description: undefined,
        required: true
      },
      type: 'string',
      types: [
        {
          text: 'En enkelt linje med tekst',
          value: 'string'
        },
        {
          text: 'Tekst med flere linjer',
          value: 'multistring'
        }
      ]
    }
  },
  methods: {
    onInsert() {
      /*
        Validation
      */
      try {
        if(!this.placeholder.label) throw new AppError('Navn mangler', 'Kan ikke sette inn felt uten navn');
        if(!this.placeholder.description) throw new AppError('Beskrivelse mangler', 'Kan ikke sette inn felt uten beskrivelse');
      } catch (err) {
        this.error = err;
      }
      /*
        Set default values
      */
      this.placeholder.type = 'string';
      if(this.type === 'multistring') {
        if(!this.placeholder.lines || !parseInt(this.placeholder.lines)) { this.placeholder.lines = 5; }
      }
      this.placeholder.path = this.placeholder.path || this.placeholder.label.toLowerCase();

      this.$emit('insert', this.placeholder);
      this.close();
    },
    onChangeType() {
      switch(this.type) {
        case 'string':
          this.placeholder.type = 'string';
          break;
        case 'multistring':
          this.placeholder.type = 'string';
      }
    },
    close() {
      this.$emit('input', false);
      this.$emit('close');
    }
  }
}
</script>

<style>

</style>