<template>
  <div style="margin-left: 4rem; margin-right: 4rem">
    <Checkbox label="Checkbox test" name="RequiredName" :value="true" :passedProps="{ onChange: (e) => handleChanged(e)}" />
  </div>
</template>

<script>
import { Checkbox } from '@vtfk/components'

export default {
  name: 'DevelopmentView',
  components: {
    Checkbox,
  },
  data() {
    return {
    }
  },
  methods: {
    handleChanged(e) {
      console.log(e.target.checked);
    }
  },
}
</script>