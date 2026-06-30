<script setup lang="ts">
import HeaderNav from '../components/layout/HeaderNav.vue'
import SectionNav from '../components/layout/SectionNav.vue'
import Intro from '../components/sections/Intro.vue'
import About from '../components/sections/About.vue'
import Stacks from '../components/sections/Stacks.vue'
import Works from '../components/sections/Works.vue'
import DesignGraphic from '../components/sections/DesignGraphic.vue'
import Contact from '../components/sections/Contact.vue'
</script>

<template>
  <HeaderNav />
  <SectionNav />

  <main>
    <Intro />
    <About />
    <Stacks />
    <Works />
    <DesignGraphic />
    <Contact />
  </main>
</template>