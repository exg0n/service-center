<template>
  <div class="chocolate-card" :class="{ 'chocolate-card--clickable': clickable }" @click="handleClick">
    <div v-if="title" class="card-header">
      <h3 class="card-title">{{ title }}</h3>
    </div>
    <div class="card-content">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  if (clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.chocolate-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(102, 85, 68, 0.08);
  overflow: hidden;
  transition: all 0.2s ease;
  border: 1px solid var(--chocolate-100);
}

.chocolate-card--clickable {
  cursor: pointer;
}

.chocolate-card--clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 85, 68, 0.12);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--chocolate-100);
  background-color: var(--chocolate-50);
}

.card-title {
  color: var(--chocolate-800);
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.card-content {
  padding: 20px;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--chocolate-100);
  background-color: var(--chocolate-50);
}
</style>