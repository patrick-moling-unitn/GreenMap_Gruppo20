<template>
<p>{{self}}</p>
<DiscountsTable :access="'all'" :admin="administrator" :self="self"/>
</template>

<script default>
import DiscountsTable from './DiscountsTable.vue'
export default {
    components: {
        DiscountsTable
    },
    data() {
        return {
            self:"",
            administrator: ""
        }
    },
    methods : {
        
    }
}
</script>