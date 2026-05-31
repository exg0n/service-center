<template>
  <span class="status-badge" :class="`status-badge--${status}`">
    {{ statusText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['pending', 'in-progress', 'completed', 'cancelled'].includes(value)
  }
})

const statusText = computed(() => {
  const map = {
    'pending': 'Ожидает',
    'in-progress': 'В работе',
    'completed': 'Выполнен',
    'cancelled': 'Отменен'
  }
  return map[props.status]
})
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s ease;
}

.status-badge:hover {
  transform: scale(1.05);
}

.status-badge--pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge--in-progress {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-badge--completed {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge--cancelled {
  background-color: #fee2e2;
  color: #991b1b;
}
</style>