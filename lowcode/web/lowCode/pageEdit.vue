<template>
  <div class="page-manager">
    <div class="toolbar">
      <el-button type="primary" size="mini" @click="openEditor">编辑 Schema</el-button>
      <el-tag v-if="jsonError" size="mini" type="danger">JSON 无效：{{ jsonError }}</el-tag>
      <el-tag v-else size="mini" type="success">预览中</el-tag>
      <el-tag v-if="dataErrors.length" size="mini" type="danger">
        Data errors: {{ dataErrors.length }}
      </el-tag>
      <el-tag v-else-if="dataWarnings.length" size="mini" type="warning">
        Data warnings: {{ dataWarnings.length }}
      </el-tag>
    </div>

    <div class="preview">
      <low-code-page :schema="previewSchema" no-page-id />
    </div>

    <el-drawer title="页面编辑" :visible.sync="drawerVisible" size="50%" :with-header="false">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="JSON" name="json">
          <!--  code-editor -->
          <div style="padding: 0 8px; box-sizing: border-box">
            <div v-if="dataErrors.length || dataWarnings.length" class="data-issues">
              <div v-if="dataErrors.length" class="data-issues-title">Data errors</div>
              <div
                v-for="(item, idx) in dataErrors.slice(0, 6)"
                :key="'de' + idx"
                class="data-issue error"
              >
                {{ item.message }}
              </div>
              <div v-if="dataWarnings.length" class="data-issues-title warning">Data warnings</div>
              <div
                v-for="(item, idx) in dataWarnings.slice(0, 6)"
                :key="'dw' + idx"
                class="data-issue warning"
              >
                {{ item.message }}
              </div>
            </div>
            <el-button size="mini" @click="$refs.ce.format()">格式化</el-button>
            <el-button
              size="mini"
              type="primary"
              :disabled="!!jsonError || dataErrors.length"
              @click="saveDraft"
            >
              保存
            </el-button>
            <code-editor ref="ce" v-model="draftText" :height="650" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="Layout" name="layout">
          <div style="padding: 0 8px; box-sizing: border-box">
            <layout-tree-editor :schema="draftSchema" @change="onSchemaChanged" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="Actions" name="Actions">
          <div style="padding: 0 8px; box-sizing: border-box">
            <actions-editor :schema="draftSchema" @change="onSchemaChanged" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="RootInit" name="rootInit">
          <div style="padding: 0 8px; box-sizing: border-box">
            <root-init-editor :schema="draftSchema" @change="onSchemaChanged" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </div>
</template>

<script>
import ActionsEditor from './component/actionComponents/actionsEditor.vue'
import CodeEditor from './component/codeEdit.vue'
import LayoutTreeEditor from './component/layoutComponents/layoutTreeEdit.vue'
import RootInitEditor from './component/rootInitComponents/rootInitEdit.vue'
import { localPage } from './localPages'
import { validateSchema } from './validate/schemaValidate'
import LowCodePage from './lowCodePage.vue'

export default {
  components: { LowCodePage, CodeEditor, LayoutTreeEditor, ActionsEditor, RootInitEditor },
  data() {
    return {
      drawerVisible: false,
      activeTab: 'json',

      draftSchema: null,
      draftText: '',
      jsonError: '',
      dataErrors: [],
      dataWarnings: [],
      previewSchema: null,

      applyTimer: null,
      syncSchemaLock: false
    }
  },
  watch: {
    // 编辑器每次改动：做 debounce + parse 成功才刷新预览
    draftText() {
      clearTimeout(this.applyTimer)
      this.applyTimer = setTimeout(this.applyDraftToPreview, 3 * 1000)
    }
  },
  created() {
    const init = localPage('user_list')
    this.draftSchema = init
    this.draftText = JSON.stringify(init, null, 2)
    // watch 会触发，所以这里要锁一下
    this.syncSchemaLock = true
    this.updateDataIssues(init)
  },

  methods: {
    openEditor() {
      this.drawerVisible = true
    },

    updateDataIssues(schema) {
      const { errors, warnings } = validateSchema(schema)
      this.dataErrors = errors
      this.dataWarnings = warnings
      return { errors, warnings }
    },

    applyDraftToPreview() {
      try {
        if (!this.draftText.trim()) {
          this.jsonError = 'Schema 为空'
          this.dataErrors = []
          this.dataWarnings = []
          return
        }
        const obj = JSON.parse(this.draftText)
        this.jsonError = ''
        if (!this.singleLock()) this.draftSchema = obj
        this.updateDataIssues(obj)
        // 这里有防抖，永远不要再其他地方修改previewSchema
        this.previewSchema = JSON.parse(JSON.stringify(obj))
      } catch (e) {
        this.jsonError = e && e.message ? e.message : 'Invalid JSON'
        this.dataErrors = []
        this.dataWarnings = []
      }
    },

    // 单次锁, schema->text->watch() 同步时阻断text->schema 循环
    singleLock() {
      if (this.syncSchemaLock) {
        this.syncSchemaLock = false
        return true
      }
      return false
    },

    onSchemaChanged() {
      // 同步回 JSON（让 JSON tab 永远对齐）
      this.draftText = JSON.stringify(this.draftSchema, null, 2)
      // watch 会触发，所以这里要锁一下
      this.syncSchemaLock = true
      this.updateDataIssues(this.draftSchema)
    },

    async saveDraft() {
      // 保存前确保 editor 校验通过
      const ret = this.$refs.ce.validate()
      if (!ret.ok) return this.$message.error('JSON 不合法，无法保存')

      const schemaObj = ret.value
      const validation = this.updateDataIssues(schemaObj)
      if (validation.errors.length) {
        return this.$message.error('Fix data errors before saving')
      }
      // TODO: 调你后端 page.update，把 schemaObj 存起来
      // await PageApi.update({ id, schema: schemaObj, ...meta })

      this.$message.success('已保存')
      this.drawerVisible = false
    }
  }
}
</script>

<style scoped>
.page-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: fixed;
  top: 0;
  left: 400px;
  padding: 8px 0;
  background: rgba(245, 247, 250, 0.5);
}
.preview {
  flex: 1;
  padding: 8px;
}
.data-issues {
  margin-bottom: 8px;
  font-size: 12px;
}
.data-issues-title {
  font-weight: 600;
  margin: 4px 0;
  color: #d93025;
}
.data-issues-title.warning {
  color: #b7791f;
}
.data-issue {
  margin-bottom: 2px;
  color: #d93025;
}
.data-issue.warning {
  color: #b7791f;
}
</style>
