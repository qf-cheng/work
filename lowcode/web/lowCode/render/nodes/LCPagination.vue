<template>
    <el-pagination
      :current-page="pageNo"
      :page-size="pageSize"
      :total="total"
      :page-sizes="pageSizes"
      :layout="layout"
      @current-change="onPageNoChange"
      @size-change="onPageSizeChange"
    />
</template>

<script>
export default {
  name: "LCPagination",
  props: {
    node: { type: Object, default: () => ({}) },
    runtime: { type: Object, default: () => ({}) },
    ctx: { type: Object, default: () => ({}) },
  },
  computed: {
    bindPagination() {
      // 建议 schema 用 bindPagination，但也兼容 bind
      return this.node.bindPagination || this.node.bind || this.node.props?.bindPagination;
    },
    pagination() {
      const p = this.bindPagination ? this.runtime.getValue(this.bindPagination) : null;
      return p || { pageNo: 1, pageSize: 10, total: 0 };
    },
    pageNo() {
      return Number(this.pagination.pageNo || 1);
    },
    pageSize() {
      return Number(this.pagination.pageSize || 10);
    },
    total() {
      return Number(this.pagination.total || 0);
    },
    pageSizes() {
      return this.node.props?.pageSizes || [10, 20, 50, 100];
    },
    layout() {
      // 你也可以改成更简洁的："prev, pager, next"
      return this.node.props?.layout || "total, sizes, prev, pager, next, jumper";
    },
    onChangeAction() {
      // 页码变化后触发的 actionId
      return this.node.on?.change || this.node.props?.onChange;
    },
  },
  methods: {
    async triggerReload() {
      if (!this.onChangeAction) return;
      await this.runtime.runAction(this.onChangeAction, this.ctx);
    },
    async onPageNoChange(v) {
      if (this.bindPagination) {
        this.runtime.setValue(`${this.bindPagination}.pageNo`, v);
      }
      await this.triggerReload();
    },
    async onPageSizeChange(v) {
      if (this.bindPagination) {
        this.runtime.setValue(`${this.bindPagination}.pageSize`, v);
        // 改 pageSize 时通常回到第一页
        this.runtime.setValue(`${this.bindPagination}.pageNo`, 1);
      }
      await this.triggerReload();
    },
  },
};
</script>
