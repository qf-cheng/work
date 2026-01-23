<template>
  <el-table :data="rows" :size="node.props?.size || 'small'" style="width: 100%">
    <el-table-column
      v-for="col in columns"
      :key="col.prop"
      :prop="col.prop"
      :label="col.label"
      :width="col.width"
    />
    <el-table-column v-if="rowActions.length" label="操作" width="160">
      <template slot-scope="{ row, $index }">
        <el-button
          v-for="act in rowActions"
          :key="act.label"
          size="mini"
          :type="act.type || 'text'"
          @click="runRowAction(act.action, row, $index)"
        >
          {{ act.label }}
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  name: 'LCTable',
  props: {
    node: { type: Object, required: true },
    runtime: { type: Object, required: true }
  },
  computed: {
    value() {
      const bind = this.node.bind || this.node.props?.bind
      return bind ? this.runtime.getValue(bind) : []
    },
    rows() {
      // bind 的值允许是：
      // 1) 数组
      // 2) { docs: [] , pagination: {} }
      // 3) 其它（兜底为空）
      if (Array.isArray(this.value)) return this.value
      if (this.value && Array.isArray(this.value.docs)) return this.value.docs
      return []
    },
    columns() {
      // columns 不写就自动从第一行推断（先跑通用）
      const cols = this.node.columns || this.node.props?.columns
      if (Array.isArray(cols) && cols.length) {
        // 处理列定义可能是字符串的情况
        return cols.map(col => {
          if (typeof col === 'string') {
            return { prop: col, label: col }
          }
          return col
        })
      }

      const first = this.rows[0]
      if (!first || typeof first !== 'object') return []
      return Object.keys(first)
        .slice(0, 8)
        .map((k) => ({ prop: k, label: k }))
    },
    rowActions() {
      return this.node.rowActions || this.node.props?.rowActions || []
    }
  },
  methods: {
    async runRowAction(actionId, row, index) {
      if (!actionId) return
      await this.runtime.runAction(actionId, { row, index })
    }
  }
}
</script>
