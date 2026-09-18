import { ref } from 'vue';

export function useToggle(initial = false) {
  const value = ref(initial);
  const toggle = () => {
    value.value = !value.value;
  };
  return { value, toggle };
}
