<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
</script>

<template>
  <section
    id="Intro"
    class="relative h-screen overflow-hidden bg-[linear-gradient(-45deg,#000000,rgb(61,22,41),rgb(36,20,63),#68648b)] bg-[length:400%_400%]"
    style="animation: gradient 14s ease-in-out infinite;"
  >
    <div
      class="pointer-events-none absolute top-[37vh] z-[1000] box-border w-full opacity-0"
      style="animation: typo_1 1000ms ease forwards;"
    >
      <h3
        class="text-center text-[1.5rem] font-bold tracking-[1.2vw] text-[rgb(255,255,130)] mix-blend-difference transition duration-300"
        style="animation: typo_1_1 900ms 800ms backwards;"
      >
        PRIME
      </h3>

      <h1
        class="whitespace-nowrap text-center text-[9.1rem] font-black leading-[9rem] text-white transition duration-300 max-[1360px]:text-[10.4vw] max-[1360px]:leading-[9.4vw] max-[450px]:whitespace-normal max-[450px]:px-[10px] max-[450px]:text-[3.8rem] max-[450px]:leading-[3.4rem]"
      >
        FRONT-END
      </h1>

      <h2
        class="text-center text-[1.6rem] font-bold tracking-[1.2vw] text-[rgb(255,255,130)] mix-blend-difference transition duration-300 max-[1360px]:text-[2.6vw] max-[450px]:text-[2.6vw]"
        style="animation: typo_1_1 900ms 800ms backwards;"
      >
        PORT_FOLIO
      </h2>
    </div>

    <div class="absolute bottom-[80px] left-1/2 z-[1000] flex -translate-x-1/2 flex-col items-center">
      <ChevronDown
        :size="35"
        :stroke-width="1.8"
        aria-hidden="true"
        class="absolute top-[18px] h-[35px] w-[35px] text-white"
        style="animation: scrolldown 1300ms 650ms linear infinite backwards;"
      />
      <ChevronDown
        :size="35"
        :stroke-width="1.8"
        aria-hidden="true"
        class="absolute top-[18px] h-[35px] w-[35px] text-white"
        style="animation: scrolldown 1300ms linear infinite;"
      />
      <p class="text-[0.8rem] font-light text-white opacity-80 transition duration-300">
        SCROLL DOWN
      </p>
    </div>
  </section>
</template>

<style>
@keyframes typo_1 {
  0% {
    top: 50vh;
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

@keyframes typo_1_1 {
  0% {
    letter-spacing: 5vw;
    opacity: 0;
  }
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

@keyframes scrolldown {
  0% {
    top: 18px;
    opacity: 0;
  }

  50% {
    top: 35px;
    opacity: 0.3;
  }

  100% {
    top: 50px;
    opacity: 0;
  }
}
</style>
