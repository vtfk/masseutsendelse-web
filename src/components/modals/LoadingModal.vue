<template>
  <div>
    <v-dialog :value="true" width="40%" :persistent="true" @click:outside="close()">
      <v-card>
        <v-card-title/>
        <v-card-text>
          <loading :title="$props.title" :message="$props.message" :submessage="$props.submessage" :subsubmessage="$props.subsubmessage" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Loading from '../Loading.vue';

export default {
  name: 'LoadingModal',
  components: {
    Loading
  },
  props: {
    title: {
      type: String
    },
    message: {
      type: String
    },
    submessage: {
      type: String
    },
    subsubmessage: {
      type: String
    }
  },
  methods: {
    close() {
      // this.$emit('close');
    }
  }
}
</script>

<style>

</style>