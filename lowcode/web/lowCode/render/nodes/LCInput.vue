<template>
  <el-input
    :placeholder="node.props?.placeholder"
    :clearable="node.props?.clearable !== false"
    :value="value"
    v-bind="node.props"
    @input="onInput"
  />
</template>

<script>
export default {
  name: "LCInput",
  props: { 
    node: { type: Object, default: () => ({}) }, 
    runtime: { type: Object, default: () => ({}) }
  },
  computed: {
    bindPath() {
      return this.node.bind || this.node.props?.bind;
    },
    value() {
      return this.bindPath ? (this.runtime.getValue(this.bindPath) ?? "") : "";
    },
  },
  methods: {
    onInput(v) {
      if (this.bindPath) this.runtime.setValue(this.bindPath, v);
    },
  },
};
</script>
