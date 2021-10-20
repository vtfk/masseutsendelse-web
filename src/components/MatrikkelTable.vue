<template>
  <VDataTable class="shadow" style="margin-top: 1rem; width: 100%;" :headers="tableHeader" :items="$props.items" :items-per-page="20" :show-expand="true">
    <template v-slot:expanded-item="{ headers, item }">
      <td :colspan="headers.length" style="padding: 1rem 1rem;">
        <h2>Eierforhold</h2>
        <VDataTable :headers="eierHeader" :items="item.eiere" :hide-default-footer="true">
        </VDataTable>
      </td>
    </template>
  </VDataTable>
</template>

<script>
  export default {
    name: 'MatrikkelTable',
    props: {
      items: { type: Array }
    },
    data() {
      return {
        tableHeader: [
          {
            text: 'Bruksnavn',
            value: 'bruksnavn'
          },
          {
            text: 'Type',
            value: 'type'
          },
          {
            text: 'Gårds #',
            value: 'gardsnummer'
          },
          {
            text: 'Bruks #',
            value: 'bruksnummer'
          },
          {
            text: 'Feste #',
            value: 'festenummer'
          },
          {
            text: 'Kommune ID',
            value: 'kommuneId'
          },
          {
            text: 'Areal',
            value: 'oppgittAreal'
          }
        ],
        eierHeader: [
          {
            text: 'Dato fra',
            value: 'datoFra'
          },
          {
            text: 'Type',
            value: 'type'
          },
          {
            text: 'Eier id',
            value: 'eierId'
          },
          {
            text: 'EierforholdKode',
            value: 'eierforholdKode'
          },
          {
            text: 'kommuneId',
            value: 'kommuneId'
          },
          {
            text: 'Andelsnummer',
            value: 'andelsnummer'
          },
          {
            text: 'Andel teller',
            value: 'andel.teller'
          },
          {
            text: 'Andel nevner',
            value: 'andel.nevner'
          }
        ]
      }
    }
  }
</script>

<style>

</style>