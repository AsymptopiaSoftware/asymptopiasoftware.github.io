/**
  Author          :Charlie Cosse
  Website         :www.asymptopia.com
  Email           :ccosse@gmail.com
  Copyright       :(C) 2023 Asymptopia Software
  License         :ALL RIGHTS RESERVED
*/
<template>
  <q-img v-if="!letter"
    :src="this.imgUrl"
    :width="this.w_pane"
    :height="this.h_pane"
    style="opacity:.8;transform:rotateZ(90deg)"
  >
    <span class="text-h6 text-blue">{{this.idx}}</span>
  </q-img>
  <div v-else class="slot-letter-face" :aria-label="letter">{{ letter }}</div>
</template>
<script>
import { defineComponent } from 'vue'
/**
  The TileComponent holds a q-img
*/
export default defineComponent ({
  name: 'TileComponent',
  props: ['imgUrl', 'w_pane', 'h_pane', 'idx', 'letter'],
  setup (props) {
    console.log(props)
    return {
    }
  }
})
</script>
<style scoped>
.slot-letter-face {
  width: 100px;
  height: 100px;
  transform: rotateZ(90deg);
  background: white;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  font: bold 70px/1 Arial, sans-serif;
}
</style>