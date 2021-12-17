<template>
  <div class="header">
    <router-link to="/" style="color: inherit; text-decoration: inherit;">
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <div class="header-part">
        <img :src="require('@/assets/VTFK.svg')" style="height: 3rem"/>
      </div>
      <div class="header-part typography heading-two">
        Masseutsendelse
      </div>
    </div>
    </router-link>
    <div style="display: flex; gap: 0.75rem; align-items: center;">
      <div class="header-part typography paragraph">Noen André</div>
      <div class="header-part swansDown user-image"><VTFKInitialsBadge firstName="Noen" lastName="André"/></div>
      <div class="header-part">
        <VTFKIconDropdownNav>
          <VTFKIconDropdownNavItem title='Hjelp' :onClick="showGuide"/>
          <VTFKIconDropdownNavItem title='Utsendelser' :onClick="() => { route('/utsendelser') }" />
          <VTFKIconDropdownNavItem title='Maler' :onClick="() => { route('/maler') }" />
          <VTFKIconDropdownNavItem title="Logg ut" href="https://www.vtfk.no" />
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
  },
  methods: {
    route(route) {
      if(!route) { return }

      this.$router.push(route);
    },
    showGuide() {
      this.$root.$emit('GuideBtnModal')
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