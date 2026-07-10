<script setup lang="ts">
defineOptions({ name: 'LandingPage' });
import FeatureContainer from '@/features/Landing/FeatureContainer.vue';
import HeroContainer from '@/features/Landing/HeroContainer.vue';
import RoadmapContainer from '@/features/Landing/RoadmapContainer.vue';
</script>

<template>
  <div class="landing">
    <HeroContainer></HeroContainer>
    <div class="landing__body">
      <FeatureContainer></FeatureContainer>
      <RoadmapContainer></RoadmapContainer>
    </div>
  </div>
</template>

<style scoped>
.landing {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
}

.landing__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: var(--space-8);
}
</style>
