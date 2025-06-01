<template>
<DiscountsTable :access="'all'" :admin="administrator" :accountId="accountId"/>
</template>

<script default>
import DiscountsTable from './DiscountsTable.vue'
import errors from '@enum/errorCodesDecoded.esm';

export default {
    components: {
        DiscountsTable
    },
    props:{
        accountId: String
    },
    data() {
    },
    methods : {
        //
    }
}
</script>