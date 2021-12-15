<template>
  <div style="margin-left: 4rem; margin-right: 4rem">
    <h1 style="margin-bottom: 0.2rem;">Development</h1>
    <p>This route is only accessible while in development-mode</p>
    <uploader v-model="files" />
  </div>
</template>

<script>
/*
  Import components
*/
import Uploader from '../components/uploader/UploadField.vue'

export default {
  name: 'DevelopmentView',
  components: {
    Uploader
  },
  data() {
    return {
      files: []
    }
  },
  methods: {
  }
}
</script>

<style>

</style>