<template>
  <el-select
    :value="value"
    :filterable="!!node.props?.filterable"
    :clearable="node.props?.clearable !== false"
    style="width: 100%;"
    :placeholder="node.props?.placeholder"
    @input="onInput" 
  >
    <el-option
      v-for="opt in options"
      :key="String(opt.value)"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
</template>

<script>
export default {
  name: "LCSelect",
  props: { 
    node: { type: Object, default: () => ({}) }, 
    runtime: { type: Object, default: () => ({}) }
  },
  computed: {
    bindPath() {
      console.log(this.node.bind);
      return this.node.bind || this.node.props?.bind;
    },
    value() {
      console.log(this.runtime.getValue(this.bindPath));
      return this.bindPath ? this.runtime.getValue(this.bindPath) : undefined;
    },
    options() {
      return this.node.options || this.node.props?.options || [];
    },
  },
  methods: {
    onInput(v) {
      if (this.bindPath) this.runtime.setValue(this.bindPath, v);
    },
  },
};
</script>
