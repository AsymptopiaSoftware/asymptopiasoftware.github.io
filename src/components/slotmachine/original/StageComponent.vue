/**
  Author          :Charlie Cosse
  Website         :www.asymptopia.com
  Email           :ccosse@gmail.com
  Copyright       :(C) 2023 Asymptopia Software
  License         :ALL RIGHTS RESERVED
*/
<template>
  <div id="stage" class="stage">
    <ReelComponent :ximgs = "this.ximgs[0]" :reelIdx="0" :reelid="'reel0'" :reelcontainerid="'reelcontainer0'" :numpanes="20" :t360="this.t360" :w_pane="'100px'" :h_pane="'100px'"/>
    <ReelComponent :ximgs = "this.ximgs[1]" :reelIdx="1" :reelid="'reel1'" :reelcontainerid="'reelcontainer1'" :numpanes="20" :t360="this.t360" :w_pane="'100px'" :h_pane="'100px'"/>
    <ReelComponent :ximgs = "this.ximgs[2]" :reelIdx="2" :reelid="'reel2'" :reelcontainerid="'reelcontainer2'" :numpanes="20" :t360="this.t360" :w_pane="'100px'" :h_pane="'100px'"/>
    <ReelComponent :ximgs = "this.ximgs[3]" :reelIdx="3" :reelid="'reel3'" :reelcontainerid="'reelcontainer3'" :numpanes="20" :t360="this.t360" :w_pane="'100px'" :h_pane="'100px'"/>
    <ReelComponent :ximgs = "this.ximgs[4]" :reelIdx="4" :reelid="'reel4'" :reelcontainerid="'reelcontainer4'" :numpanes="20" :t360="this.t360" :w_pane="'100px'" :h_pane="'100px'"/>
    <ReelComponent :ximgs = "this.ximgs[5]" :reelIdx="5" :reelid="'reel5'" :reelcontainerid="'reelcontainer5'" :numpanes="20" :t360="this.t360" :w_pane="'100px'" :h_pane="'100px'"/>
    <ReelComponent :ximgs = "this.ximgs[6]" :reelIdx="6" :reelid="'reel6'" :reelcontainerid="'reelcontainer6'" :numpanes="20" :t360="this.t360" :w_pane="'100px'" :h_pane="'100px'"/>
    <!--
    -->
    <hline id="h2"/>
  </div>
</template>
<script>
import { defineComponent, ref } from 'vue'
import ReelComponent from './ReelComponent.vue'
/**
  The StageComponent holds a set of ReelComponents
*/

export default defineComponent({
  name: 'StageComponent',
  components: {
    ReelComponent
  },
  props: ['t360', 'ximgs'],
  setup(props){
    console.log(props)
    return {
      t_elapsed: ref(0)
    }
  },
  mounted(){
    this.t_elapsed = 0
  }
})
</script>
<style>
#stage {
  width: 100%;
  height: 700px;
  background-color: #bbddbb;
}
#h2 {
  position: absolute;
  top: 350px;
  background-color: red;
  width:100%;
  height:1px;
}
</style>