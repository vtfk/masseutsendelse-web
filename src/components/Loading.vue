<template>
    <div class="spinner-container">
        <h2 v-if="$props.title" style="margin-bottom: 0.5rem;">{{$props.title}}</h2>
        <p v-if="$props.message" style="margin-top: 0;">{{$props.message}}</p>
        <p v-if="$props.submessage" style="margin-top: 0;">{{$props.submessage}}</p>
        <VTFKSpinner size="large"/>
    </div>
</template>

<script>
// VTFK komponenter
import { Spinner } from '@vtfk/components';

export default {
    name: 'Loaded',
    components: {
        'VTFKSpinner': Spinner
    },
    props: {
        title: {
            type: String
        },
        message: {
            type: String
        },
        submessage: {
            type: String
        }
    }
}
</script>

<style scoped>
    .spinner-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
    }
</style>