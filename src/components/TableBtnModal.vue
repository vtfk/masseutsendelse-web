<template>
    <div>
        <VTFKButton :passedProps="{onClick: onClick}">Tidligere opplastninger</VTFKButton>
        <VTFKModal title="Tidligere opplastninger" :open="isShowModal" :onDismiss="() => { this.isShowModal = false }" style="z-index: 1000;">
            <div>
                <v-data-table
                    :headers="headers"
                    :items="prosjekter"
                    :items-per-page="5"
                    class="elevation-1"
                ></v-data-table>
            </div>
        </VTFKModal>
    </div>
</template>

<script>

import { Button, Modal } from '@vtfk/components'

export default {
    name: 'TableBtnModal',
    components: {
        'VTFKButton': Button,
        'VTFKModal': Modal,
    },
    data() {
        return {
        isShowModal: false,
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
