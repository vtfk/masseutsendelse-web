<template>
  <div>
    <VTFKButton :passedProps="{onClick: onClick}">Se mer</VTFKButton>
    <VTFKModal title="Guide" :open="isShowModal" :onDismiss="() => { this.isShowModal = false }" style="z-index: 1001;">
      <VTFKModalBody>
        <div class="header-part typography heading-one">Bruk av siden</div>

        Her er det noe teskt
      </VTFKModalBody>
    </VTFKModal>
  </div>
</template>

<script>
// VTFK komponenter
import { Button, Modal, ModalBody } from '@vtfk/components'

export default {
  name: 'GuideBtnModal',
  components: {
    'VTFKButton': Button,
    'VTFKModal': Modal,
    'VTFKModalBody': ModalBody
  },
  data() {
    return {
      isShowModal: false
    }
  },
  methods: {
    onClick() {
      this.isShowModal = !this.isShowModal;
    }
  }
}
</script>

<style scoped>

</style>