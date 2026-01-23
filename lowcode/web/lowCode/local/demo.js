module.exports = {
  id: 'user_crud',
  title: '用户管理',
  rootInit: {
    $data: {
      query: { email: '' },
      userList: { docs: [], pagination: { pageNo: 1, pageSize: 10, total: 0 } },
      editing: { id: '', form: { uid: '', nickname: '', email: '' } }
    },
    $ui: {
      dlgEditVisible: false
    }
  },
  actions: {
    loadUsers: {
      type: 'resource.list',
      resource: 'user',
      to: '$data.userList',
      pageNo: '$data.userList.pagination.pageNo',
      pageSize: '$data.userList.pagination.pageSize',
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
            nickname: '',
            email: ''
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
          resource: 'user',
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
          resource: 'user',
          id: '$data.editing.form._id',
          data: '$data.editing.form'
        },
        'loadUsers'
      ]
    },
    saveCreate: {
      type: 'flow',
      steps: [
        {
          type: 'resource.create',
          resource: 'user',
          data: '$data.editing.form'
        },
        'loadUsers'
      ]
    },
    removeUser: {
      type: 'flow',
      steps: [{ type: 'resource.remove', resource: 'user', id: '$ctx.row._id' }, 'loadUsers']
    }
  },
  onLoadAction: 'loadUsers',
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
                on: { click: 'loadUsers' }
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
                  placeholder: '请输入邮箱',
                  size: 'small'
                },
                bind: '$data.query.email'
              },
              {
                type: 'Button',
                text: '查询',
                props: { size: 'small' },
                on: { click: 'loadUsers' }
              }
            ]
          }
        ]
      },
      {
        type: 'Table',
        bind: '$data.userList',
        props: {
          columns: [
            { prop: 'uid', label: 'UID' },
            { prop: 'nickname', label: '昵称' },
            { prop: 'email', label: '邮箱' }
          ],
          size: 'small'
        },
        rowActions: [
          { label: '编辑', action: 'openEdit' },
          { label: '删除', action: 'removeUser', type: 'danger' }
        ]
      },

      {
        type: 'Container',
        props: { justify: 'flex-end' },
        children: [
          {
            type: 'Pagination',
            bindPagination: '$data.userList.pagination',
            props: {
              pageSizes: [10, 20, 50, 100],
              layout: 'total, sizes, prev, pager, next, jumper'
            },
            on: { change: 'loadUsers' }
          }
        ]
      },

      {
        type: 'Dialog',
        title: '编辑用户',
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
                label: '昵称',
                children: [
                  {
                    type: 'Input',
                    props: {
                      placeholder: '请输入昵称'
                    },
                    bind: '$data.editing.form.nickname'
                  }
                ]
              },
              {
                type: 'FormItem',
                label: '邮箱',
                children: [
                  {
                    type: 'Input',
                    props: {
                      placeholder: '请输入邮箱'
                    },
                    bind: '$data.editing.form.email'
                  }
                ]
              },
              {
                type: 'FormItem',
                label: '性别',
                children: [
                  {
                    type: 'Select',
                    bind: '$data.editing.form.gender1',
                    options: [
                      { label: '未知', value: 0 },
                      { label: '男', value: 1 },
                      { label: '女', value: 2 }
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
