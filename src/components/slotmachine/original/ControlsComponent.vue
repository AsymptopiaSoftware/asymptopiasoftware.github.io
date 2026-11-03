/**
  Author          :Charlie Cosse
  Website         :www.asymptopia.com
  Email           :ccosse@gmail.com
  Copyright       :(C) 2023 Asymptopia Software
  License         :ALL RIGHTS RESERVED
*/
<template>
  <div id="controlPanel" class="controls flex flex-col flex-center justify-center">
    <div>
    <span class="confetti hidden fixed-center">
      <ConfettiExplosion
        v-if="confettiOn"
        :stageHeight="800"
        style="position: relative; top: -200px; left: 40px"
      />
    </span>
    <div class="" id="resultsLabel">-.-.-.-.-</div>
      <div class="" id="timerLabel">
      {{this.t_elapsed.toFixed(3)}}
      </div>
      <q-btn class="controlB" no-caps style="background-color:green" v-if="!this.spinning" @click="this.spin()">Spin</q-btn>
      <q-btn class="controlB" no-caps style="background-color:red" v-else >Wait ...</q-btn>
    </div>
  </div>
</template>
<script>
import { defineComponent, ref } from 'vue'
import * as d3 from 'd3'
import ConfettiExplosion from 'vue-confetti-explosion'
/**
  The ControlsComponent holds the timerLabel and Start/Stop button
  It performs a double hyperbolic transform in parabolic coordinates.
*/
export default defineComponent({
  name: 'ControlsComponent',
  components: {
    ConfettiExplosion
  },
  props: ['ximgs', 't360', 'numpane'],
  setup(props){
    console.log(props)
    return {
      spinning: ref(false),
      t_elapsed: ref(0),
      t0: Date.now(),
      interval: ref(null),
      pi: Math.acos(-1),
      degPerPane: parseFloat(360./props.numpane),
      degPerSec: 360./parseFloat(props.t360),
      secPerTab: null,
      msPerTab: null,
      startNumbers: [0, 0, 0, 0, 0],
      confettiOn: ref(false)
    }
  },
  mounted(){
    console.log('degPerPane', this.degPerPane)
    console.log('degPerSec', this.degPerSec)
    this.secPerTab = this.degPerPane / this.degPerSec
    console.log('secPerTab', this.secPerTab)
    this.msPerTab = this.secPerTab * 1000.
    console.log('confettiOn', this.confettiOn)
  },
  methods:{
    async explode () {
      console.log('EXPLODE!')
      d3.select('.confetti').classed('hidden', false).classed('z-max', true)
      this.confettiOn = true
      // await nextTick();
      window.setTimeout(() => {
        this.confettiOn = false
        d3.select('.confetti').classed('hidden', true)
        console.log('confettiOn', this.confettiOn)
      }, 5000)
    },
    tick(){
      d3.select("#timerLabel").html(((Date.now() - this.t0)/1000.).toFixed(3))
      if (this.spinning == true) {
        cancelAnimationFrame(this.interval);
        this.interval = requestAnimationFrame(() => {
          this.tick();
        });
      }
    },
    spin(){
      d3.select("#resultsLabel").html('-.-.-.-.-')
      d3.selectAll(".reel").classed("spinning", false)
      // d3.selectAll(".reel").classed("paused", false) // this resets to initial zero rotation
      window.setTimeout(() => {
        console.log('Spin')
        this.t0 = Date.now()
        this.spinning = true
        this.paused = false
        // 250 = .25s = 1 Pane @ 360(20)/5s; +250 -> currently advancing by 1 pane ea reel
        // const dtRun = (3000 + parseInt(Math.random()*3) * 1000 + this.msPerTab)
        const dtRun = ((this.msPerTab*10) + parseInt(Math.random()*10) * (this.msPerTab) + this.msPerTab) //
        console.log('dtRun', dtRun)
        d3.selectAll(".reel").classed("spinning", this.spinning)
        this.tick()
        window.setTimeout(() => this.stop(), dtRun)
      }, 100)
    },
    stop(){
      console.log('Stop')
      cancelAnimationFrame(this.interval);
      this.spinning = false
      this.paused = true
      // reels stop from L to R by adding sufficient int to allow for max previous dt
      let HTML = ''
      window.setTimeout(() => {
        d3.select("#reel0").classed("spinning", this.spinning)
        d3.select("#reel0").classed("paused", this.paused)
        let tileNo = this.startNumbers[0] + parseInt((Date.now() - this.t0)/this.msPerTab)
        while (tileNo > 19) tileNo -= 20
        this.startNumbers[0] = tileNo
        console.log(this.ximgs[0][tileNo])
        HTML += tileNo + ", "
        d3.select("#resultsLabel").html(HTML)
      },0*this.msPerTab)
      window.setTimeout(() => {
        d3.select("#reel1").classed("spinning", this.spinning)
        d3.select("#reel1").classed("paused", this.paused)
        let tileNo = this.startNumbers[1] + parseInt((Date.now() - this.t0)/this.msPerTab)
        this.startNumbers[1] = tileNo
        while (tileNo > 19) tileNo -= 20
        console.log(this.ximgs[1][tileNo])
        HTML += tileNo + ", "
        d3.select("#resultsLabel").html(HTML)
      },(1 + parseInt(Math.random() * 5))*this.msPerTab)
      window.setTimeout(() => {
        d3.select("#reel2").classed("spinning", this.spinning)
        d3.select("#reel2").classed("paused", this.paused)
        let tileNo = this.startNumbers[2] + parseInt((Date.now() - this.t0)/this.msPerTab)
        while (tileNo > 19) tileNo -= 20
        this.startNumbers[2] = tileNo
        console.log(this.ximgs[2][tileNo])
        HTML += tileNo + ", "
        d3.select("#resultsLabel").html(HTML)
      },(5 + parseInt(Math.random() * 5))*this.msPerTab)
      window.setTimeout(() => {
        d3.select("#reel3").classed("spinning", this.spinning)
        d3.select("#reel3").classed("paused", this.paused)
        let tileNo = this.startNumbers[3] + parseInt((Date.now() - this.t0)/this.msPerTab)
        while (tileNo > 19) tileNo -= 20
        this.startNumbers[3] = tileNo
        console.log(this.ximgs[3][tileNo])
        HTML += tileNo + ", "
        d3.select("#resultsLabel").html(HTML)
      },(9 + parseInt(Math.random()) * 5)*this.msPerTab)
      window.setTimeout(() => {
        d3.select("#reel4").classed("spinning", this.spinning)
        d3.select("#reel4").classed("paused", this.paused)
        let tileNo = this.startNumbers[4]+ parseInt((Date.now() - this.t0)/this.msPerTab)
        while (tileNo > 19) tileNo -= 20
        console.log(this.ximgs[4][tileNo])
        this.startNumbers[4] = tileNo
        HTML += tileNo
        d3.select("#resultsLabel").html(HTML)
        this.explode()
      },(13 + parseInt(Math.random() * 5))*this.msPerTab)
    }
  }
})
</script>
<style>
.controls {width:100%;height:150px;background-color:orange}
.controlB {width: 100px; height:50px;width:200px }
#timerLabel {font-weight: bold; font-size: 24px;position:relative;width:200px;left:70px}
#resultsLabel {font-weight: bold; font-size: 24px;position:relative;width:200px;text-align:center;}
</style>