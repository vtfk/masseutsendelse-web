<template>
  <div id="app">
    <header class="header">
      <div>
        <div>LOGO</div>
        <div>Masseutsendelse</div>
      </div>
      <div>
        <div>Navn</div>
        <div>Avatar</div>
        <div>...</div>
      </div>
    </header>
    <content>
      <div>
        <VTFKButton :passedProps="{onClick: () => {this.isShowModal = true}}">Test modal</VTFKButton>
      </div>
      <VTFKModal :open="isShowModal" title="Test modal" :onDismiss="() => {this.isShowModal = false}">
        Test
        :passedProps="{onDismiss: () => {this.isShowModal = false}}
      </VTFKModal>
    </content>
  </div>
</template>

<script>
import { Button } from '@vtfk/components'
import { Modal } from '@vtfk/components'

export default {
  name: 'App',
  components: {
    'VTFKButton': Button,
    'VTFKModal': Modal,
  },
  data() {
    return {
      isSpinning: false,
      isShowModal: false
    }
  },
  methods: {
    // onClick() {
    //   // alert('Jeg har blitt klikket på')
    //   this.isSpinning = !this.isSpinning;
    // }
  }
}
</script>

<style>
#app {
  width: 100vw;
  height: 100vh;
  text-align: center;
  background: rgba(190,218,202,.3);
}

  .header {
    display: flex;
    justify-content: space-between;
    padding-left: 4rem;
    padding-right: 4rem;
    padding-top: 2rem;
  }
</style>
