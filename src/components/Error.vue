<template>
  <div>
    <div v-if="$props.error" class="error-card">
      <h1>En feil har oppstått</h1>
      <h3 v-if="$props.error.title">{{$props.error.title}}</h3>
      <p v-if="$props.error.message">{{$props.error.message}}</p>
      <!-- <strong>Stack:</strong>
      <p style="text-align: left;">{{error.stack}}</p> -->
      <div v-if="$props.showResetButton" style="display: flex; justify-content: center;">
        <VTFKButton style="margin-top: 1rem;" :passedProps="{onClick: () => { $emit('resetClicked') }}">Start på nytt</VTFKButton>
      </div>
    </div>
  </div>
</template>

<script>

  // VTFK komponenter
  import { Button } from '@vtfk/components'
  import AppError from '../lib/AppError'

  export default {
    name: 'Error',
    components: {
      'VTFKButton': Button
    },
    props: {
      error: {
        type: [ Object, AppError]
      },
      showResetButton: {
        type: Boolean,
        default: true
      }
    },
  }
</script>

<style>
  .error-card {
    width: 100%;
    height: 100%;
    background-color: #F8D3D1;
    border-radius: 10px; 
    padding: 1rem 1rem;
    padding-bottom: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>