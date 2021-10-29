<template>
  <v-select
    :value="$props.value"
    @input="(e) => { $emit('input', e.value ) }"
    :items="items"
    label="Sett status for prosjektet"
    :menu-props="{ bottom: true, offsetY: true }"
    :disabled="$props.disabled || $props.value === 'completed' || $props.value === 'inprogress'"
    :hint="selectedItem.hint"
    persistent-hint
    hide-selected
    outlined
    rounded
    return-object
    single-line
    style="width: 350px; z-index: 1000;"
  > 
    <template item>
      <v-chip :color="selectedItem.color" style="width: 100%;">
        {{ selectedItem.text }}
      </v-chip>
    </template>
    <template #selection>
      <v-chip :color="selectedItem.color" style="width: 100%;">
        {{ selectedItem.text }}
      </v-chip>
    </template>
  </v-select>
</template>

<script>
export default {
  name: 'DispatchStatusSelect',
  props: {
    value: {
      type: String,
      require: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      items: [
        { text: 'Ikke godkjenning', value: 'notapproved', color: '#E7827E', hint: 'Utsendelsen vil ikke skje før den er godkjent' },
        { text: 'Godkjent', value: 'approved', color: '#E0C38B', hint: 'Utsendelsen vil gjennomføres ved neste kjøring 00:00' }
      ]
    }
  },
  computed: {
    selectedItem() {
      let match = this.items.find((i) => i.value === this.$props.value);
      if(match) { return match }

      return { text: 'Ukjent', value: 'unknown', color: '#555555' }
    }
  },
  created() {
    if(this.$props.value === 'completed') {
      this.items = [{ text: 'Fullført', value: 'completed', color: '#91B99F', hint: 'Utsendelsen er gjennomført' }]
    } else if(this.$props.value === 'inprogress') {
      this.items = [{ text: 'Kjører', value: 'inprogress', color: '#91B99F', hint: 'Utsendelsen kjører nå' }]
    }
  }
}
</script>

<style scoped>


</style>