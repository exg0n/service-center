<template>
  <div class="input-wrapper" :class="{ 'no-margin': noMargin }">
    <label v-if="label" :for="id" class="input-label">{{ label }}</label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      class="chocolate-input"
      :class="{ 'chocolate-input--error': error }"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    />
    <span v-if="error" class="input-error">{{ error }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    required: true
  },
  noMargin: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue', 'blur'])
</script>

<style scoped>
.input-wrapper {
  margin-bottom: 16px;
}

.input-wrapper.no-margin {
  margin-bottom: 0;
}

.input-label {
  display: block;
  margin-bottom: 6px;
  color: var(--chocolate-700);
  font-weight: 500;
  font-size: 14px;
}

.chocolate-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--chocolate-200);
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.2s ease;
  background-color: white;
}

.chocolate-input:focus {
  outline: none;
  border-color: var(--chocolate-600);
  box-shadow: 0 0 0 3px rgba(127, 107, 88, 0.1);
}

.chocolate-input:hover {
  border-color: var(--chocolate-400);
}

.chocolate-input--error {
  border-color: #dc2626;
}

.chocolate-input--error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.input-error {
  display: block;
  margin-top: 4px;
  color: #dc2626;
  font-size: 12px;
}
</style>