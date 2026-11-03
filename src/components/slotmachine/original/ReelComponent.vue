/**
  Author          :Charlie Cosse
  Website         :www.asymptopia.com
  Email           :ccosse@gmail.com
  Copyright       :(C) 2023 Asymptopia Software
  License         :ALL RIGHTS RESERVED
*/
<template>
  <div v-bind:id="this.reelcontainerid" class="reel_container">
    <div v-bind:id="this.reelid" class="reel">
      <div v-for="(val,idx) in this.numpanes" :key="idx" class="pane">
        <TileComponent :imgUrl="this.tileImgs[idx]" :w_pane="this.w_pane" :h_pane="this.h_pane" :idx="idx"/>
      </div>
    </div>
  </div>
</template>
<script>
import { defineComponent, ref } from 'vue'
import TileComponent from './TileComponent.vue'
/**
  The ReelComponent holds contains npane TileComonents arranged in a carousel 
  by CSS3D properties.
*/
export default defineComponent({
  name: 'ReelComponent',
  components: { TileComponent },
  props: [ 'ximgs', 'reelIdx', 'reelid', 'reelcontainerid', 't360', 'numpanes', 'w_pane', 'h_pane' ],
  setup(props){
    return {
      tileImgs: ref([])
    }
  },
  mounted(){
    this.tileImgs = this.ximgs
  }
})
</script>
<style>
  .reel_container {
    width: 20px;
    height: 10px;
    position: absolute;
    border: 1px solid #f00f;
    top: calc((700px - 10px) / 2);
    transform: rotateZ(-90deg);
    perspective: 1200px;
  }
  #reelcontainer0 {
    left: calc(1*(100% - 20px) / 6);
  }
  #reelcontainer1 {
    left: calc(2*(100% - 20px) / 6);
  }
  #reelcontainer2 {
    left: calc(3*(100% - 20px) / 6);
  }
  #reelcontainer3 {
    left: calc(4*(100% - 20px) / 6);
  }
  #reelcontainer4 {
    left: calc(5*(100% - 20px) / 6);
  }
  .reel {
    width: 100%;
    height: 100%;
    position: relative;
    left: 0px;
    background-color: navy;
    -webkit-transform-style: preserve-3d;
    -moz-transform-style: preserve-3d;
    -o-transform-style: preserve-3d;
    transform-style: preserve-3d;
  }
  .reel .pane {
    position: absolute;
    width: 100px;
    height: 100px;
    backface-visibility: visible;
    top: calc((-100px + 10px) / 2);
    left: calc((-100px + 20px) / 2);
    -webkit-transform-style: preserve-3d;
    -moz-transform-style: preserve-3d;
    -o-transform-style: preserve-3d;
    transform-style: preserve-3d;
  }
  .reel .pane:nth-child(1) {
    border: 1px solid #f00;
    transform: rotateY(0deg) translateZ(315px);
  }
  .reel .pane:nth-child(2) {
    border: 1px solid #0f0;
    transform: rotateY(18deg) translateZ(315px);
  }
  .reel .pane:nth-child(3) {
    border: 1px solid #00f;
    transform: rotateY(36deg) translateZ(315px);
  }
  .reel .pane:nth-child(4) {
    border: 1px solid #f0f;
    transform: rotateY(54deg) translateZ(315px);
  }
  .reel .pane:nth-child(5) {
    border: 1px solid #000;
    transform: rotateY(72deg) translateZ(315px);
  }
  .reel .pane:nth-child(6) {
    border: 1px solid #000;
    transform: rotateY(90deg) translateZ(315px);
  }
  .reel .pane:nth-child(7) {
    border: 1px solid #000;
    transform: rotateY(108deg) translateZ(315px);
  }
  .reel .pane:nth-child(8) {
    border: 1px solid #000;
    transform: rotateY(126deg) translateZ(315px);
  }
  .reel .pane:nth-child(9) {
    border: 1px solid #000;
    transform: rotateY(144deg) translateZ(315px);
  }
  .reel .pane:nth-child(10) {
    border: 1px solid #000;
    transform: rotateY(162deg) translateZ(315px);
  }
  .reel .pane:nth-child(11) {
    border: 1px solid #000;
    transform: rotateY(180deg) translateZ(315px);
  }
  .reel .pane:nth-child(12) {
    border: 1px solid #000;
    transform: rotateY(198deg) translateZ(315px);
  }
  .reel .pane:nth-child(13) {
    border: 1px solid #000;
    transform: rotateY(216deg) translateZ(315px);
  }
  .reel .pane:nth-child(14) {
    border: 1px solid #000;
    transform: rotateY(234deg) translateZ(315px);
  }
  .reel .pane:nth-child(15) {
    border: 1px solid #000;
    transform: rotateY(252deg) translateZ(315px);
  }
  .reel .pane:nth-child(16) {
    border: 1px solid #000;
    transform: rotateY(270deg) translateZ(315px);
  }
  .reel .pane:nth-child(17) {
    border: 1px solid #000;
    transform: rotateY(288deg) translateZ(315px);
  }
  .reel .pane:nth-child(18) {
    border: 1px solid #000;
    transform: rotateY(306deg) translateZ(315px);
  }
  .reel .pane:nth-child(19) {
    border: 1px solid #000;
    transform: rotateY(324deg) translateZ(315px);
  }
  .reel .pane:nth-child(20) {
    border: 1px solid #000;
    transform: rotateY(342deg) translateZ(315px);
  }
  .reel.paused {
    animation: spinY 5000ms infinite normal linear forwards paused;
  }
  .reel.spinning {
    animation: spinY 5000ms infinite normal linear forwards running;
  }
  @keyframes spinY {
    0% {
      transform: rotateY(360deg) translateZ(0px);
    }
    100% {
      transform: rotateY(0deg) translateZ(0px);
    }
  }
</style>