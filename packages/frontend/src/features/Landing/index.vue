<script setup lang="ts">
defineOptions({ name: 'LandingPage' });
import FeatureContainer from '@/features/Landing/FeatureContainer.vue';
import HeroContainer from '@/features/Landing/HeroContainer.vue';
import RoadmapContainer from '@/features/Landing/RoadmapContainer.vue';
</script>

<template>
  <div class="base-container">
    <HeroContainer></HeroContainer>
    <FeatureContainer></FeatureContainer>
    <RoadmapContainer></RoadmapContainer>
  </div>
</template>

<style scoped>
.base-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);

  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}
</style>
