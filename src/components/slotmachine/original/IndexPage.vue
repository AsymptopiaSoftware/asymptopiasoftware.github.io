/**
  Author          :Charlie Cosse
  Website         :www.asymptopia.com
  Email           :ccosse@gmail.com
  Copyright       :(C) 2023 Asymptopia Software
  License         :ALL RIGHTS RESERVED
*/
<template>
  <div class="original-slotmachine">
    <div>
    <!-- t360 < 5 is too accurate and leads to bad alignment; also must manually set animation-duration at ReelComponent-->
    <StageComponent :ximgs = "this.ximgs" :letters="this.welcomeLetters" :t360="5"/>
    <ControlsComponent :ximgs = "this.ximgs" :t360="5" :numpane="20"/>
    </div>
  </div>
</template>
<script>
import { defineComponent, ref } from 'vue'
import StageComponent from './StageComponent.vue'
import ControlsComponent from './ControlsComponent.vue'
/**
  The IndexPage holds the Stage and Controls
*/
const reelImgs = [
  '/images/slot/cherries.png',
  '/images/slot/pineapple.png',
  '/images/slot/lemon.png',
  '/images/slot/seven.png',
  '/images/slot/gem.png',
  '/images/slot/seven2.png',
  '/images/slot/bar.png',
  '/images/slot/bell.png',
  '/images/slot/seven3.png',
  '/images/slot/dollar.png',
  '/images/slot/cherries.png',
  '/images/slot/pineapple.png',
  '/images/slot/lemon.png',
  '/images/slot/seven.png',
  '/images/slot/gem.png',
  '/images/slot/seven2.png',
  '/images/slot/bar.png',
  '/images/slot/bell.png',
  '/images/slot/seven3.png',
  '/images/slot/chest.png'
]
const welcomeLetters = ['W', 'E', 'L', 'C', 'O', 'M', 'E']
const offset = 3 // each reel is advanced by <offset> images from the previous reel (-3, +3); more than |3| * seven reels use offsets 0, 3, 6, 9, 12, 15, 18
export default defineComponent({
  name: 'IndexPage',
  components: {StageComponent, ControlsComponent},
  setup () {
    return {
      turn: null,
      welcomeLetters,
      ximgs: ref([
        reelImgs.slice(offset*0,20).concat(reelImgs.slice(0, offset*0)),
        reelImgs.slice(offset*1,20).concat(reelImgs.slice(0, offset*1)),
        reelImgs.slice(offset*2,20).concat(reelImgs.slice(0, offset*2)),
        reelImgs.slice(offset*3,20).concat(reelImgs.slice(0, offset*3)),
        reelImgs.slice(offset*4,20).concat(reelImgs.slice(0, offset*4)),
        reelImgs.slice(offset*5,20).concat(reelImgs.slice(0, offset*5)),
        reelImgs.slice(offset*6,20).concat(reelImgs.slice(0, offset*6))
      ])
    }
  }
})
</script>
<style>
.original-slotmachine { position: relative; width: 100%; }
</style>