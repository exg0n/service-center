<template>
  <button 
    class="chocolate-btn" 
    :class="[`chocolate-btn--${variant}`, { 'chocolate-btn--full': fullWidth }]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline'].includes(value)
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<style scoped>
.chocolate-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.chocolate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 85, 68, 0.2);
}

.chocolate-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(102, 85, 68, 0.2);
}

.chocolate-btn--primary {
  background-color: var(--chocolate-700);
  color: var(--chocolate-50);
}

.chocolate-btn--primary:hover {
  background-color: var(--chocolate-800);
}

.chocolate-btn--secondary {
  background-color: var(--chocolate-200);
  color: var(--chocolate-800);
}

.chocolate-btn--secondary:hover {
  background-color: var(--chocolate-300);
}

.chocolate-btn--outline {
  background-color: transparent;
  border: 2px solid var(--chocolate-600);
  color: var(--chocolate-600);
}

.chocolate-btn--outline:hover {
  background-color: var(--chocolate-600);
  color: var(--chocolate-50);
}

.chocolate-btn--full {
  width: 100%;
}

.chocolate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style>