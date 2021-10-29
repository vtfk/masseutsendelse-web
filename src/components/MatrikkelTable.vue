<template>
  <VDataTable class="shadow" style="width: 100%;" :headers="tableHeader" :items="$props.items" item-key="bruksnavn" :items-per-page="20" :show-expand="true">
    <template v-slot:expanded-item="{ headers, item }">
      <td :colspan="headers.length" style="padding: 1rem 1rem;">
        <h2>Eierforhold</h2>
        <VDataTable :headers="eierHeader" :items="item.eierforhold" item-key="id" :hide-default-footer="true">
          <template v-slot:[`item.$type`]="{ item }">
            <div v-if="item.$type">
              <div v-if="item.$type.toLowerCase().includes('juridisk')">
                🏢 Juridisk 
              </div>
              <div v-else>
                🏠 Privat 
              </div>
            </div>
          </template>
          <template v-slot:[`item.adresse`]="{ item }">
            <div v-if="item.eier && item.eier.postadresse">
              <div v-if="item.eier.postadresse.adresselinje1">{{item.eier.postadresse.adresselinje1}}</div>
              <div v-if="item.eier.postadresse.adresselinje2">{{item.eier.postadresse.adresselinje2}}</div>
              <div v-if="item.eier.postadresse.adresselinje3">{{item.eier.postadresse.adresselinje3}}</div>
              <div v-if="item.eier.postadresse.adresselinje4">{{item.eier.postadresse.adresselinje4}}</div>
              <div v-if="item.eier.postadresse.adresselinje5">{{item.eier.postadresse.adresselinje5}}</div>
            </div>
          </template>
          <template v-slot:[`item.andel`]="{ item }">
            <div v-if="item.andel && item.andel.teller && item.andel.nevner">
              {{item.andel.teller}} / {{item.andel.nevner}} ({{(item.andel.teller / item.andel.nevner) * 100}}%)
            </div>
          </template>
        </VDataTable>
      </td>
    </template>
  </VDataTable>
</template>

<script>
  export default {
    name: 'MatrikkelTable',
    props: {
      items: { type: Array },
      'item-key': {
        type: [String, Number],
        default: 'id'
      }
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
            value: '$type'
          },
          {
            text: 'Gårds #',
            value: 'matrikkelnummer.gardsnummer'
          },
          {
            text: 'Bruks #',
            value: 'matrikkelnummer.bruksnummer'
          },
          {
            text: 'Feste #',
            value: 'matrikkelnummer.festenummer'
          },
          {
            text: 'Kommune ID',
            value: 'matrikkelnummer.kommuneId'
          },
          {
            text: 'Areal',
            value: 'historiskOppgittAreal'
          }
        ],
        eierHeader: [
          {
            text: 'Dato fra',
            value: 'datoFra'
          },
          {
            text: 'Type',
            value: '$type'
          },
          {
            text: 'Eier',
            value: 'eier.navn'
          },
          {
            text: 'Org-/Person-nummer',
            value: 'eier.nummer'
          },
          {
            text: 'Postadresse',
            value: 'adresse'
          },
          {
            text: 'Andel',
            value: 'andel'
          }
        ]
      }
    }
  }
</script>

<style>

</style>