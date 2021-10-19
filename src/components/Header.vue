<template>
  <div class="header">
    <a href="https://masseutsendelse.vtfk.dev/" style="color: inherit; text-decoration: inherit;">
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <div class="header-part">
        <img :src="require('@/assets/VTFK.svg')" style="height: 3rem"/>
      </div>
      <div class="header-part typography heading-two">
        Masseutsendelse
      </div>
    </div>
    </a>
    <div style="display: flex; gap: 0.75rem; align-items: center;">
      <div class="header-part typography paragraph">Noen André</div>
      <div class="header-part swansDown user-image"><VTFKInitialsBadge firstName="Noen" lastName="André"/></div>
      <div class="header-part">
        <VTFKIconDropdownNav>
          <VTFKIconDropdownNavItem title='Hjelp' :onClick="() => { }" />
          <VTFKIconDropdownNavItem title="Logg ut" href="https://www.vtfk.no" />
          <VTFKIconDropdownNavItem title='Tidligere opplastninger' :onClick="() => { }" />
        </VTFKIconDropdownNav>
      </div>
    </div>
  </div>
</template>

<script>
// VTFK komponenter
import { InitialsBadge, IconDropdownNav, IconDropdownNavItem } from '@vtfk/components'


export default {
  name: 'Header',
  components: {
    'VTFKInitialsBadge': InitialsBadge,
    'VTFKIconDropdownNav': IconDropdownNav,
    'VTFKIconDropdownNavItem': IconDropdownNavItem,
    
  },
  data() {
    return {
    }
  }
}
</script>

<style scoped>
  .header {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .header-part {
    display: flex;
    align-items: center;
  }

  @media only screen and (max-width: 500px) {
    .header {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

</style>