<template>
  <div style="text-align: left;">
    <VTFKButton :passedProps="{onClick: onClick}">Se mer</VTFKButton>
    <VTFKModal title="Guide" :open="isShowModal" :onDismiss="() => { this.isShowModal = false }" style="z-index: 1000;">
      <div style="width: 100%; padding-left: 4rem; margin-top: -2rem;">
        <!-- Om siden -->
        <div class="header-part typography heading-two">Om siden</div>
        <p>Tekst om siden</p>
        <span class="error">Det er viktig at polygonet benytter koordinatsystem EUREF89 UTM Sone 32</span>
        <!-- Bruk av siden -->
        <div style="margin-top: 2rem;" class="header-part typography heading-two">Bruk av siden</div>
        <p>
          1. Last opp polygon fil<br>
          2. Verifiser at polygonet treffer korrekt på kart<br>
          3. Trykk på Kontakt Matrikkel-knappen<br>
          4. Verifiser at innhentet informasjon ser korrekt ut<br>
          5. Fyll ut informasjon om varslet som skal sendes ut til alle eiere<br>
          6. Trykk forhåndsvisning og kvitter ut at utsendelsen ser korrekt ut<br>
          7. Trykk Send inn<br>
          <br>
          Utsendelsen vil så legges i en kø og sendes ut klokken 00:00
          <br>
          Hvis du ønsker å endre eller kanselere en utsendelse åpne [Utsendelser]
        </p>
        <!-- Se, endre, slette -->
        <div style="margin-top: 2rem;" class="header-part typography heading-two">Se, endre, slette</div>
        <p>
          Etter 
        </p>
      </div>
    </VTFKModal>
  </div>
</template>

<script>
// VTFK komponenter
import { Button, Modal } from '@vtfk/components'

export default {
  name: 'GuideBtnModal',
  components: {
    'VTFKButton': Button,
    'VTFKModal': Modal,
    // 'VTFKModalBody': ModalBody
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
  .error {
    color: red;
  }
</style>