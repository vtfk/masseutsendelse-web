<template>
    <div>
    <VTFKButton type='secondary' size='small' style="padding-bottom: 1rem;" :passedProps="{onClick: onClick}">Rediger Modal</VTFKButton>
    <VTFKModal title="Rediger" :open="isShowModal" :onDismiss="() => { this.isShowModal = false }" style="z-index: 1000;">
                <div style="display: flex; flex-direction: row; justify-content: space-between; margin-left: 2rem; margin-right:2rem;">
                    <div>
                        Dette er
                    </div>
                    <div>
                        en test
                    </div>
                </div>
    </VTFKModal>
    </div>
</template>

<script>
//VTFK komponenter
import { Button, Modal } from '@vtfk/components'

export default {
    name: 'TableBtnModal',
    components: {
        'VTFKButton': Button,
        'VTFKModal': Modal,
    },
    data(){
        return {
        isShowModal: false,
        }
    }, 
    methods: {
        onClick() {
            this.isShowModal = !this.isShowModal;
        },
    }
}

</script>

<style>

</style>