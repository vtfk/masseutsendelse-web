<template>
  <div>
    <div v-if="$props.error" class="error-card">
      <!-- <h1>En feil har oppstått</h1> -->
      <h1 style="margin-bottom: 0.75rem;">
        <span v-if="statusCode">{{statusCode}} - </span>
        {{$props.error.title || $props.defaultTitle}}
      </h1>
      <h3 v-if="$props.error.message">{{$props.error.message}}</h3>
      <div v-if="$props.error.errors" style="margin-top: 0.75rem;">
        <ul>
          <li v-for="(err, i) in $props.error.errors" :key="i">{{err}}</li>
        </ul>
      </div>
      <div v-if="isShowStack && $props.error.stack" class="stackField">
        <h3>Detaljer</h3>
        {{ $props.error.stack }}
      </div>
      <div style="display: flex; justify-content: start; gap: 1rem; margin-top: 1rem;">
        <VTFKButton v-if="$props.showResetButton" style="margin-top: 1rem;" size="small" :passedProps="{onClick: () => { $emit('resetClicked') }}">Start på nytt</VTFKButton>
        <VTFKButton v-if="$props.showOkButton" style="margin-top: 1rem;" size="small" :passedProps="{onClick: () => { $emit('ok') }}">Ok</VTFKButton>
        <VTFKButton v-if="$props.error && $props.error.stack" style="margin-top: 1rem;" size="small" :passedProps="{onClick: () => { isShowStack = !isShowStack }}">{{!isShowStack ? 'Vis detaljer' : 'Skjul detaljer'}}</VTFKButton>
        <VTFKButton style="display: none;" :passedProps="{onClick: () => { }}"/>
      </div>
    </div>
  </div>
</template>

<script>

  // VTFK komponenter
  import { Button } from '@vtfk/components'
  import AppError from '../../lib/vtfk-errors/AppError'

  export default {
    name: 'ErrorField',
    components: {
      'VTFKButton': Button
    },
    data() {
      return {
        isShowStack: false
      }
    },
    props: {
      error: {
        type: [ Object, Error, AppError],
        reqruire: true
      },
      defaultTitle: {
        type: String,
        default: 'En feil har oppstått'
      },
      showResetButton: {
        type: Boolean,
        default: true
      },
      showOkButton: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      statusCode() {
        if(!this.$props.error) return '';
        if(this.$props.error.statusCode) return this.$props.error.statusCode;
        if(this.$props.error.status) return this.$props.error.status;
        return '';
      }
    }
  }
</script>

<style>
  .error-card {
    width: 100%;
    height: 100%;
    border-radius: 10px; 
    padding: 1rem 1rem;
    background-color: #F8D3D1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stackField {
    margin-top: 0.75rem;
    padding: 0.75rem;
    border-radius: 10px;
    max-height: 400px;
    overflow-y: auto;
    background-color: #ffe8e7;
  }
</style>