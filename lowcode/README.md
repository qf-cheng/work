
# lowcede

这只是lowcode低代码平台的一部分核心代码，仅限于用于AI的分析资料，不包含完整的低代码平台功能，和运行能力。

## 项目结构

- server：低代码平台的后端代码
  - router：express路由
  - service：业务数据层
- web：低代码平台的后端代码
  - lowCode：低代码平台的前端核心代码

## 使用

  注意文件引用路径在这里不成立，因为不运行用于分析。
  但文件名是可以判断其引用的。

  当前后端架构是基于express + mongodb的，前端是在vue2 + element-ui的基础上实现的
  