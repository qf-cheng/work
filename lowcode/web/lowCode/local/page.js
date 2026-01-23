module.exports = {
  id: 'admin_list',
  title: 'page管理',
  rootInit: {
    $data: {
      query: { key: '', title: '' },
      pageList: { docs: [], pagination: { pageNo: 1, pageSize: 10, total: 0 } },
      editing: {
        id: '',
        mode: 'create',
        form: { key: '', title: '', routePath: '', schema: {}, status: 'draft' }
      }
    },
    $ui: { dlgEditVisible: false }
  },
  actions: {
    loadPages: {
      type: 'resource.list',
      resource: 'page',
      to: '$data.pageList',
      pageNo: '$data.pageList.pagination.pageNo',
      pageSize: '$data.pageList.pagination.pageSize',
      condition: '$data.query'
    },
    save: {
      type: 'branch',
      value: '$data.editing.mode',
      cases: {
        create: 'saveCreate',
        edit: 'saveEdit'
      }
    },
    openCreate: {
      type: 'flow',
      steps: [
        { type: 'set', to: '$data.editing.mode', value: 'create' },
        { type: 'set', to: '$ui.dlgEditVisible', value: true },
        {
          type: 'set',
          to: '$data.editing.form',
          value: {
            key: '',
            title: '',
            routePath: '',
            schema: {},
            status: 'draft'
          }
        }
      ]
    },
    openEdit: {
      type: 'flow',
      steps: [
        { type: 'set', to: '$data.editing.mode', value: 'edit' },
        {
          type: 'resource.detail',
          resource: 'page',
          id: '$ctx.row._id',
          to: '$data.editing.form'
        },
        { type: 'set', to: '$ui.dlgEditVisible', value: true }
      ]
    },
    saveEdit: {
      type: 'flow',
      steps: [
        {
          type: 'resource.update',
          resource: 'page',
          id: '$data.editing.form._id',
          data: '$data.editing.form'
        },
        'loadPages'
      ]
    },
    saveCreate: {
      type: 'flow',
      steps: [
        {
          type: 'resource.create',
          resource: 'page',
          data: '$data.editing.form'
        },
        'loadPages'
      ]
    },
    removePage: {
      type: 'flow',
      steps: [{ type: 'resource.remove', resource: 'page', id: '$ctx.row._id' }, 'loadPages']
    }
  },
  onLoadAction: 'loadPages',
  layout: {
    type: 'Container',
    props: { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
    children: [
      {
        type: 'Container',
        props: { justify: 'space-between' },
        children: [
          {
            type: 'Container',
            props: {},
            children: [
              {
                type: 'Button',
                text: '刷新',
                props: { size: 'small' },
                on: { click: 'loadPages' }
              },
              {
                type: 'Button',
                text: '新增',
                props: { size: 'small' },
                on: { click: 'openCreate' }
              }
            ]
          },
          {
            type: 'Container',
            props: {},
            children: [
              {
                type: 'Input',
                props: {
                  placeholder: '请输入页面key',
                  size: 'small'
                },
                bind: '$data.query.key'
              },
              {
                type: 'Button',
                text: '查询',
                props: { size: 'small' },
                on: { click: 'loadPages' }
              }
            ]
          }
        ]
      },
      {
        type: 'Table',
        bind: '$data.pageList',
        props: {
          columns: [
            { prop: 'key', label: '页面key' },
            { prop: 'title', label: '页面标题' },
            { prop: 'routePath', label: '路由路径' },
            { prop: 'status', label: '状态' }
          ],
          size: 'small'
        },
        rowActions: [
          { label: '编辑', action: 'openEdit' },
          { label: '删除', action: 'removePage', type: 'danger' }
        ]
      },

      {
        type: 'Container',
        props: { justify: 'flex-end' },
        children: [
          {
            type: 'Pagination',
            bindPagination: '$data.pageList.pagination',
            props: {
              pageSizes: [10, 20, 50, 100],
              layout: 'total, sizes, prev, pager, next, jumper'
            },
            on: { change: 'loadPages' }
          }
        ]
      },

      {
        type: 'Dialog',
        title: '编辑页面',
        bindVisible: '$ui.dlgEditVisible',
        on: { ok: 'save' },
        children: [
          {
            type: 'Form',
            props: {
              model: '$data.editing.form',
              labelWidth: '80px'
            },
            children: [
              {
                type: 'FormItem',
                label: '页面key',
                children: [
                  {
                    type: 'Input',
                    props: {
                      placeholder: '请输入页面key'
                    },
                    bind: '$data.editing.form.key'
                  }
                ]
              },
              {
                type: 'FormItem',
                label: '页面标题',
                children: [
                  {
                    type: 'Input',
                    props: {
                      placeholder: '请输入页面标题'
                    },
                    bind: '$data.editing.form.title'
                  }
                ]
              },
							{
                type: 'FormItem',
                label: '路由路径',
                children: [
                  {
                    type: 'Input',
                    props: {
                      placeholder: '请输入路由路径'
                    },
                    bind: '$data.editing.form.routePath'
                  }
                ]
              },
              {
                type: 'FormItem',
                label: '状态',
                children: [
                  {
                    type: 'Select',
                    bind: '$data.editing.form.status',
                    options: [
                      { label: '草稿', value: 0 },
                      { label: '测试', value: 1 },
                      { label: '发布', value: 2 },
											{ label: '禁用', value: 3 }
                    ],
                    props: { clearable: false }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
