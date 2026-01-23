<template>
  <div>
    {{ text }}
  </div>
</template>

<script>
export default {
  name: "LCText",
  props: {
    node: { type: Object, required: true },
    runtime: { type: Object, required: true },
  },
  computed: {
    text() {
      return this.node.text || this.node.type || "";
    },
  },
};
</script>
