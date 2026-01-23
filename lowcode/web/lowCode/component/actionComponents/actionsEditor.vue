<template>
  <div style="display: flex; gap: 12px">
    <!-- 左侧 action 列表 -->
    <div style="width: 260px; border-right: 1px solid #eee; padding-right: 12px">
      <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center">
        <el-input v-model="newName" size="mini" placeholder="actionId" style="flex: 1" />
        <el-select v-model="newType" size="mini" placeholder="type" style="width: 120px">
          <el-option v-for="t in createTypes" :key="t" :label="t" :value="t" />
        </el-select>
      </div>
      <div style="display: flex; gap: 8px; margin-bottom: 12px">
        <el-button size="mini" type="primary" @click="createAction">新增</el-button>
        <el-button size="mini" :disabled="!selectedName" @click="renameAction">重命名</el-button>
        <el-button size="mini" type="danger" :disabled="!selectedName" @click="removeAction">
          删除
        </el-button>
      </div>

      <el-input
        v-model="filter"
        size="mini"
        placeholder="过滤"
        clearable
        style="margin-bottom: 8px"
      />

      <el-menu :default-active="selectedName" style="border-right: none" @select="onSelect">
        <el-menu-item v-for="name in filteredNames" :key="name" :index="name">
          <span style="display: flex; justify-content: space-between; width: 100%">
            <span>{{ name }}</span>
            <span style="opacity: 0.6; font-size: 12px">{{ actions[name]?.type }}</span>
          </span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧编辑面板 -->
    <div style="flex: 1; padding-left: 4px">
      <div v-if="!selectedName" style="opacity: 0.7; padding: 12px">请选择一个 action</div>

      <div v-else>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          "
        >
          <div style="font-weight: 600">
            {{ selectedName }}
            <span style="opacity: 0.6; font-size: 12px">({{ current.type || 'unknown' }})</span>
          </div>

          <div style="display: flex; gap: 8px">
            <el-button size="mini" :disabled="!selectedName" @click="duplicateAction">
              复制
            </el-button>
          </div>
        </div>

        <!-- 通用字段 -->
        <el-form label-width="90px" size="mini">
          <el-form-item label="type">
            <el-input :value="current.type" disabled />
          </el-form-item>

          <!-- set -->
          <template v-if="current.type === 'set'">
            <el-form-item label="to">
              <el-input
                v-model="current.to"
                placeholder="$data.xxx / $ui.xxx"
                @input="emitChange"
              />
            </el-form-item>
            <el-form-item label="value">
              <el-input
                v-model="current.value"
                placeholder="可写常量或 $path"
                @input="emitChange"
              />
            </el-form-item>
          </template>

          <!-- flow -->
          <template v-else-if="current.type === 'flow'">
            <el-form-item label="steps">
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px">
                <el-select
                  v-model="stepAddKind"
                  size="mini"
                  placeholder="新增 step 类型"
                  style="width: 160px"
                >
                  <el-option v-for="t in stepKinds" :key="t" :label="t" :value="t" />
                </el-select>

                <el-select
                  v-if="stepAddKind === 'actionRef'"
                  v-model="stepAddActionRef"
                  size="mini"
                  placeholder="选择 action"
                  style="width: 180px"
                >
                  <el-option v-for="n in actionNames" :key="n" :label="n" :value="n" />
                </el-select>

                <el-button size="mini" type="primary" @click="addStep">添加</el-button>
              </div>

              <div
                v-if="!Array.isArray(current.steps) || current.steps.length === 0"
                style="opacity: 0.7"
              >
                暂无 steps
              </div>

              <div v-else>
                <div
                  v-for="(s, idx) in current.steps"
                  :key="idx"
                  style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 8px;
                    border: 1px solid #eee;
                    border-radius: 6px;
                    margin-bottom: 6px;
                  "
                >
                  <div style="width: 28px; opacity: 0.7">{{ idx + 1 }}</div>

                  <div style="flex: 1">
                    <div style="font-size: 12px; opacity: 0.7; margin-bottom: 4px">
                      {{ stepSummary(s) }}
                    </div>

                    <!-- step 结构化编辑：最小版，只对 set/resource 做字段编辑；actionRef 显示下拉 -->
                    <div v-if="isActionRef(s)" style="display: flex; gap: 8px; align-items: center">
                      <el-tag size="mini">actionRef</el-tag>
                      <el-select
                        size="mini"
                        :value="s"
                        placeholder="选择 action"
                        style="width: 240px"
                        @change="(v) => updateStep(idx, v)"
                      >
                        <el-option v-for="n in actionNames" :key="n" :label="n" :value="n" />
                      </el-select>
                    </div>

                    <div
                      v-else-if="s && s.type === 'set'"
                      style="display: flex; gap: 8px; flex-wrap: wrap"
                    >
                      <el-tag size="mini">set</el-tag>
                      <el-input
                        size="mini"
                        :value="s.to"
                        placeholder="to"
                        style="width: 240px"
                        @input="(v) => setStepField(idx, 'to', v)"
                      />
                      <el-input
                        size="mini"
                        :value="s.value"
                        placeholder="value"
                        style="width: 240px"
                        @input="(v) => setStepField(idx, 'value', v)"
                      />
                    </div>

                    <div
                      v-else-if="s && isResourceType(s.type)"
                      style="display: flex; gap: 8px; flex-wrap: wrap"
                    >
                      <el-tag size="mini">{{ s.type }}</el-tag>
                      <el-input
                        size="mini"
                        :value="s.resource"
                        placeholder="resource"
                        style="width: 160px"
                        @input="(v) => setStepField(idx, 'resource', v)"
                      />
                      <el-input
                        size="mini"
                        :value="s.to"
                        placeholder="to"
                        style="width: 220px"
                        @input="(v) => setStepField(idx, 'to', v)"
                      />
                      <el-input
                        v-if="
                          s.type === 'resource.detail' ||
                          s.type === 'resource.update' ||
                          s.type === 'resource.remove'
                        "
                        size="mini"
                        :value="s.id"
                        placeholder="id($ctx/_id)"
                        style="width: 220px"
                        @input="(v) => setStepField(idx, 'id', v)"
                      />
                      <el-input
                        v-if="s.type === 'resource.create' || s.type === 'resource.update'"
                        size="mini"
                        :value="s.data"
                        placeholder="data($data.xxx)"
                        style="width: 220px"
                        @input="(v) => setStepField(idx, 'data', v)"
                      />
                      <el-input
                        v-if="s.type === 'resource.list'"
                        size="mini"
                        :value="s.condition"
                        placeholder="condition"
                        style="width: 220px"
                        @input="(v) => setStepField(idx, 'condition', v)"
                      />
                    </div>

                    <div v-else style="opacity: 0.7">
                      当前 step 类型未结构化支持（仍可先用 JSON 模式做），type={{ s && s.type }}
                    </div>
                  </div>

                  <div style="display: flex; gap: 6px">
                    <el-button size="mini" :disabled="idx === 0" @click="moveStep(idx, idx - 1)">
                      ↑
                    </el-button>
                    <el-button
                      size="mini"
                      :disabled="idx === current.steps.length - 1"
                      @click="moveStep(idx, idx + 1)"
                    >
                      ↓
                    </el-button>
                    <el-button size="mini" type="danger" @click="removeStep(idx)">删</el-button>
                  </div>
                </div>
              </div>
            </el-form-item>
          </template>

          <!-- branch -->
          <template v-else-if="current.type === 'branch'">
            <el-form-item label="value">
              <el-input v-model="current.value" placeholder="$data.xxx" @input="emitChange" />
            </el-form-item>

            <el-form-item label="cases">
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px">
                <el-input
                  v-model="caseKey"
                  size="mini"
                  placeholder="case key (e.g. create)"
                  style="width: 160px"
                />
                <el-select
                  v-model="caseAction"
                  size="mini"
                  placeholder="actionId"
                  style="width: 220px"
                >
                  <el-option v-for="n in actionNames" :key="n" :label="n" :value="n" />
                </el-select>
                <el-button size="mini" type="primary" @click="addCase">添加/覆盖</el-button>
              </div>

              <div v-if="!current.cases || !Object.keys(current.cases).length" style="opacity: 0.7">
                暂无 cases
              </div>

              <div v-else>
                <div
                  v-for="k in Object.keys(current.cases)"
                  :key="k"
                  style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 8px;
                    border: 1px solid #eee;
                    border-radius: 6px;
                    margin-bottom: 6px;
                  "
                >
                  <el-tag size="mini">{{ k }}</el-tag>
                  <el-select
                    size="mini"
                    :value="current.cases[k]"
                    style="width: 240px"
                    @change="(v) => updateCase(k, v)"
                  >
                    <el-option v-for="n in actionNames" :key="n" :label="n" :value="n" />
                  </el-select>
                  <el-button size="mini" type="danger" @click="removeCase(k)">删除</el-button>
                </div>
              </div>
            </el-form-item>
          </template>

          <!-- resource.* (非 flow step 的顶层 action) -->
          <template v-else-if="isResourceType(current.type)">
            <el-form-item label="resource">
              <el-input
                v-model="current.resource"
                placeholder="resource name"
                @input="emitChange"
              />
            </el-form-item>

            <el-form-item v-if="current.type === 'resource.list'" label="to">
              <el-input v-model="current.to" placeholder="$data.xxx" @input="emitChange" />
            </el-form-item>
            <el-form-item v-if="current.type === 'resource.list'" label="pageNo">
              <el-input v-model="current.pageNo" placeholder="$data.xxx" @input="emitChange" />
            </el-form-item>
            <el-form-item v-if="current.type === 'resource.list'" label="pageSize">
              <el-input v-model="current.pageSize" placeholder="$data.xxx" @input="emitChange" />
            </el-form-item>
            <el-form-item v-if="current.type === 'resource.list'" label="condition">
              <el-input v-model="current.condition" placeholder="$data.query" @input="emitChange" />
            </el-form-item>

            <el-form-item v-if="current.type === 'resource.detail'" label="id">
              <el-input v-model="current.id" placeholder="$ctx.row._id" @input="emitChange" />
            </el-form-item>
            <el-form-item v-if="current.type === 'resource.detail'" label="to">
              <el-input v-model="current.to" placeholder="$data.xxx" @input="emitChange" />
            </el-form-item>

            <el-form-item v-if="current.type === 'resource.create'" label="data">
              <el-input v-model="current.data" placeholder="$data.form" @input="emitChange" />
            </el-form-item>

            <el-form-item v-if="current.type === 'resource.update'" label="id">
              <el-input v-model="current.id" placeholder="$data.form._id" @input="emitChange" />
            </el-form-item>
            <el-form-item v-if="current.type === 'resource.update'" label="data">
              <el-input v-model="current.data" placeholder="$data.form" @input="emitChange" />
            </el-form-item>

            <el-form-item v-if="current.type === 'resource.remove'" label="id">
              <el-input v-model="current.id" placeholder="$ctx.row._id" @input="emitChange" />
            </el-form-item>
          </template>

          <template v-else>
            <div style="opacity: 0.7; padding: 12px">
              暂不支持该 action.type 的结构化编辑：{{ current.type }}
            </div>
          </template>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export default {
  name: 'ActionsEditor',
  props: {
    schema: { type: Object, required: true } // 父传 draftSchema
  },
  data() {
    return {
      filter: '',
      selectedName: '',

      newName: '',
      newType: 'flow',

      // flow add step
      stepAddKind: 'set',
      stepAddActionRef: '',

      // branch add case
      caseKey: '',
      caseAction: ''
    }
  },
  computed: {
    actions() {
      const a = this.schema && this.schema.actions
      return a && typeof a === 'object' ? a : {}
    },
    actionNames() {
      return Object.keys(this.actions)
    },
    filteredNames() {
      const f = (this.filter || '').trim().toLowerCase()
      const list = this.actionNames.slice().sort()
      if (!f) return list
      return list.filter((n) => n.toLowerCase().includes(f))
    },
    current() {
      return this.selectedName ? this.actions[this.selectedName] : null
    },
    createTypes() {
      return [
        'set',
        'flow',
        'branch',
        'resource.list',
        'resource.detail',
        'resource.create',
        'resource.update',
        'resource.remove'
      ]
    },
    stepKinds() {
      return [
        'set',
        'resource.list',
        'resource.detail',
        'resource.create',
        'resource.update',
        'resource.remove',
        'actionRef'
      ]
    }
  },
  watch: {
    schema: {
      immediate: true,
      handler() {
        // 确保 actions 存在
        if (!this.schema.actions) Vue.set(this.schema, 'actions', {})
        // 默认选择第一个
        if (!this.selectedName) {
          const first = Object.keys(this.schema.actions)[0]
          if (first) this.selectedName = first
        } else if (!this.schema.actions[this.selectedName]) {
          this.selectedName = Object.keys(this.schema.actions)[0] || ''
        }
      }
    }
  },
  methods: {
    emitChange() {
      this.$emit('change')
    },
    onSelect(name) {
      this.selectedName = name
      // 初始化 flow add action ref
      if (!this.stepAddActionRef) this.stepAddActionRef = this.actionNames[0] || ''
      if (!this.caseAction) this.caseAction = this.actionNames[0] || ''
    },

    // ---------- action CRUD ----------
    createAction() {
      const name = (this.newName || '').trim()
      if (!name) return this.$message.error('actionId 不能为空')
      if (this.actions[name]) return this.$message.error('actionId 已存在')

      const tpl = this.actionTemplate(this.newType)
      Vue.set(this.schema.actions, name, tpl)
      this.selectedName = name
      this.newName = ''
      this.emitChange()
    },

    renameAction() {
      if (!this.selectedName) return
      this.$prompt('请输入新的 actionId', '重命名', {
        inputValue: this.selectedName,
        inputPattern: /^[A-Za-z0-9_-]+$/,
        inputErrorMessage: '只允许字母数字下划线/中划线'
      })
        .then(({ value }) => {
          const newName = (value || '').trim()
          if (!newName) return
          if (newName === this.selectedName) return
          if (this.actions[newName]) return this.$message.error('新 actionId 已存在')

          const old = this.selectedName
          const obj = this.actions[old]
          Vue.set(this.schema.actions, newName, obj)
          Vue.delete(this.schema.actions, old)

          this.selectedName = newName
          this.emitChange()
        })
        .catch(() => {})
    },

    removeAction() {
      if (!this.selectedName) return
      const name = this.selectedName
      this.$confirm(`确认删除 action: ${name} ?`, '提示', { type: 'warning' })
        .then(() => {
          Vue.delete(this.schema.actions, name)
          this.selectedName = Object.keys(this.schema.actions)[0] || ''
          this.emitChange()
        })
        .catch(() => {})
    },

    duplicateAction() {
      if (!this.selectedName) return
      const base = this.selectedName
      let n = base + '_copy'
      let i = 2
      while (this.actions[n]) {
        n = base + '_copy' + i
        i++
      }
      const copy = deepClone(this.actions[base])
      Vue.set(this.schema.actions, n, copy)
      this.selectedName = n
      this.emitChange()
    },

    actionTemplate(type) {
      if (type === 'set') return { type: 'set', to: '', value: '' }
      if (type === 'flow') return { type: 'flow', steps: [] }
      if (type === 'branch') return { type: 'branch', value: '', cases: {} }

      if (this.isResourceType(type)) {
        const base = { type, resource: '' }
        if (type === 'resource.list')
          return { ...base, to: '', pageNo: '', pageSize: '', condition: '' }
        if (type === 'resource.detail') return { ...base, id: '', to: '' }
        if (type === 'resource.create') return { ...base, data: '' }
        if (type === 'resource.update') return { ...base, id: '', data: '' }
        if (type === 'resource.remove') return { ...base, id: '' }
      }
      return { type }
    },

    // ---------- flow steps ----------
    ensureSteps() {
      if (!this.current) return []
      if (!Array.isArray(this.current.steps)) Vue.set(this.current, 'steps', [])
      return this.current.steps
    },

    addStep() {
      if (!this.current || this.current.type !== 'flow') return
      const steps = this.ensureSteps()

      if (this.stepAddKind === 'actionRef') {
        const a = this.stepAddActionRef || this.actionNames[0]
        if (!a) return this.$message.error('没有可引用的 action')
        steps.push(a)
        this.emitChange()
        return
      }

      const stepObj = this.actionTemplate(this.stepAddKind)
      // 注意：step 模板里 type=resource.xxx 时会有 resource 字段；set/branch/flow 等也行
      steps.push(stepObj)
      this.emitChange()
    },

    removeStep(idx) {
      const steps = this.ensureSteps()
      steps.splice(idx, 1)
      this.emitChange()
    },

    moveStep(from, to) {
      const steps = this.ensureSteps()
      const item = steps[from]
      steps.splice(from, 1)
      steps.splice(to, 0, item)
      this.emitChange()
    },

    isActionRef(step) {
      return typeof step === 'string'
    },

    updateStep(idx, newVal) {
      const steps = this.ensureSteps()
      Vue.set(steps, idx, newVal)
      this.emitChange()
    },

    setStepField(idx, key, val) {
      const steps = this.ensureSteps()
      const s = steps[idx]
      if (!s || typeof s === 'string') return
      Vue.set(s, key, val)
      this.emitChange()
    },

    stepSummary(s) {
      if (typeof s === 'string') return `actionRef: ${s}`
      if (!s) return 'null'
      if (s.type === 'set') return `set ${s.to} = ${String(s.value)}`
      if (this.isResourceType(s.type)) return `${s.type} ${s.resource || ''}`
      return `${s.type || 'unknown'}`
    },

    // ---------- branch cases ----------
    ensureCases() {
      if (!this.current) return {}
      if (!this.current.cases || typeof this.current.cases !== 'object')
        Vue.set(this.current, 'cases', {})
      return this.current.cases
    },

    addCase() {
      if (!this.current || this.current.type !== 'branch') return
      const k = (this.caseKey || '').trim()
      if (!k) return this.$message.error('case key 不能为空')
      const a = this.caseAction || this.actionNames[0]
      if (!a) return this.$message.error('actionId 不能为空')

      const cases = this.ensureCases()
      Vue.set(cases, k, a)
      this.caseKey = ''
      this.emitChange()
    },

    updateCase(k, v) {
      const cases = this.ensureCases()
      Vue.set(cases, k, v)
      this.emitChange()
    },

    removeCase(k) {
      const cases = this.ensureCases()
      Vue.delete(cases, k)
      this.emitChange()
    },

    // ---------- helpers ----------
    isResourceType(type) {
      return typeof type === 'string' && type.startsWith('resource.')
    }
  }
}
</script>
