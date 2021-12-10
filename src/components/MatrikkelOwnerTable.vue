<template>
  <VDataTable class="shadow" width="100%" style="width: 100%;" :headers="tableHeader" :items="$props.items" item-key="id" :items-per-page="20" :show-expand="true">
    <template v-slot:[`item._type`]="{ item }">
      <div v-if="item._type">
        <div v-if="item._type.toLowerCase().includes('juridisk')">
          🏢 Juridisk 
        </div>
        <div v-else>
          🏠 Privat 
        </div>
      </div>
    </template>
    <template v-slot:[`item.ownershipCount`]="{ item }">
      {{item.ownerships.length}}
    </template>
    <template v-slot:[`item.postadresse`]="{ item }">
      {{getPostAddress(item.postadresse)}}
    </template>
    <template v-slot:[`item.actions`]="{ item }">
      <v-btn 
        v-if="$props.type === 'included'"
        icon
        @click="excludeOwner(item)"
      >
        <v-icon>mdi-minus-circle-outline</v-icon>
      </v-btn>
      <v-btn 
        v-if="$props.type === 'excluded'"
        icon
        @click="includeOwner(item);"
      >
        <v-icon>mdi-plus-circle-outline</v-icon>
      </v-btn>
    </template>
    <template v-slot:expanded-item="{ headers, item }">
      <td :colspan="headers.length" style="padding: 1rem 1rem;">
        <h2>Eierforhold</h2>
        <VDataTable :headers="ownershipHeaders" :items="item.ownerships" item-key="id" :hide-default-footer="true">
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
    name: 'MatrikkelOwnerTable',
    props: {
      type: {
        type: String,
        default: 'included'
      },
      items: {
        type: Array
      },
      'item-key': {
        type: [String, Number],
        default: 'id'
      }
    },
    data() {
      return {
        tableHeader: [
          {
            text: 'Navn',
            value: 'navn'
          },
          {
            text: 'Type',
            value: '_type'
          },
          {
            text: 'Antall eierskap',
            value: 'ownershipCount'
          },
          {
            text: 'Postadresse',
            value: 'postadresse'
          },
          {
            text: 'Handlinger',
            value: 'actions'
          }
        ],
        ownershipHeaders: [
          {
            text: 'Dato fra',
            value: 'datoFra'
          },
          {
            text: 'Type',
            value: '_type'
          },
          {
            text: 'Bruksnavn',
            value: 'unit.bruksnavn'
          },
          {
            text: 'Andel',
            value: 'andel'
          }
        ]
      }
    },
    methods: {
      getPostAddress(person) {
        let address = '';
        if(person.adresselinje) address += person.adresselinje + ' ';
        if(person.adresselinje1) address += person.adresselinje1 + ' ';
        if(person.adresselinje2) address += person.adresselinje2 + ' ';
        if(person.adresselinje3) address += person.adresselinje3 + ' ';
        return address.trim();
      },
      excludeOwner(owner) {
        if(!owner) return;
        if(!confirm('Er du helt sikker på at eieren skal ekskluderes?')) return;
        this.$emit('excludeOwner', owner)
      },
      includeOwner(owner) {
        if(!owner) return;
        if(!confirm('Er du helt sikker på at eieren skal inkluderes?')) return;
        this.$emit('includeOwner', owner)
      },
    }
  }
</script>

<style>

</style>