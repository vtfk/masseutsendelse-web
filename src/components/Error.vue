<template>
  <div v-if="error" class="error-card">
    <h1>En feil har oppstått</h1>
    <h3 v-if="error.title">{{error.title}}</h3>
    <p v-if="error.message">{{error.message}}</p>
    <!-- <strong>Stack:</strong>
    <p style="text-align: left;">{{error.stack}}</p> -->
    <div style="display: flex; justify-content: center;">
      <VTFKButton style="margin-top: 1rem;" :passedProps="{onClick: () => { $emit('resetClicked') }}">Start på nytt</VTFKButton>
    </div>
  </div>
</template>

<script>

  // VTFK komponenter
  import { Button } from '@vtfk/components'

  export default {
    name: 'Error',
    components: {
      'VTFKButton': Button
    },
    props: {
      error: {
        type: Object || Error
      }
    },
  }
</script>

<style>
  .error-card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>