<template>
  <div class="card-container">
    <div v-for="item in $props.items" :key="item.title" class="card">
      <div class="card-header">
        <div class="typography heading-two">{{item.title}}</div>
      </div>
      <div class="card-body">
        <div class="typography heading-three">
          {{item.text}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatCards',
  props: {
    items: {
      type: Array,
      default: () => [{title: 'Private', text: '100'}, { title: 'Bedrifter', text: '79' }, { title: 'Borettslag', text: '3' },]
    }
  },
  data() {
    return {
      
    }
  }
}
</script>

<style scoped>
  .card-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content:  center;
    gap: 2rem;
    width: 100%;
  }

  .card {
    display: flex;
    flex-direction: column;
    height: 200px;
    width: 200px;
    background-color: #CFEBF2;
    padding: 1rem 1rem;
    box-shadow: 0px 1px 2px 1px #888888;
    border-radius: 10px;
  }

  .card-header {
    flex: 0;
  }

  .card-body {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 0 1 auto;
    height: 100%;
    width: 100%;
  }

</style>