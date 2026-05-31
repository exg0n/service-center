<script setup>
import AppHeader from './components/layout/AppHeader.vue'
</script>

<template>
  <div class="app">
    <AppHeader />
    <main class="main">
      <!-- Здесь должны отображаться страницы через роутер -->
      <router-view />
    </main>
  </div>
</template>

<style>
@import './assets/main.css';

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
}
</style>