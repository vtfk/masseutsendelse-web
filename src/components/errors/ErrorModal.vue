<template>
  <div>
    <v-dialog v-if="$props.error" :value="true" width="40%">
      <v-card>
        <v-card-title></v-card-title>
        <v-card-text>
          <ErrorField
            :error="$props.error"
            :showResetButton="$props.showResetButton" 
            :showOkButton="$props.showOkButton"
            @ok="close"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
// VTFK komponenter
import AppError from '../../lib/vtfk-errors/AppError';

export default {
  name: 'ErrorModal',
  components: {
  },
  props: {
    error: {
        type: [ Object, AppError, Error],
        require: true
    },
    showOkButton: {
      type: Boolean,
      default: true
    },
    showResetButton: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    close() {
      this.$emit('close');
      this.$emit('input', undefined);
    }
  }
}
</script>

<style scoped>

</style>