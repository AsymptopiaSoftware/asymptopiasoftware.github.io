/**
  Author          :Charlie Cosse
  Website         :www.asymptopia.com
  Email           :ccosse@gmail.com
  Copyright       :(C) 2023 Asymptopia Software
  License         :ALL RIGHTS RESERVED
*/
<template>
  <q-img
    :src="this.imgUrl"
    :width="this.w_pane"
    :height="this.h_pane"
    style="opacity:.8;transform:rotateZ(90deg)"
  >
    <span class="text-h6 text-blue">{{this.idx}}</span>
  </q-img>
</template>
<script>
import { defineComponent } from 'vue'
/**
  The TileComponent holds a q-img
*/
export default defineComponent ({
  name: 'TileComponent',
  props: ['imgUrl', 'w_pane', 'h_pane', 'idx'],
  setup (props) {
    console.log(props)
    return {
    }
  }
})
</script>
<style>
</style>