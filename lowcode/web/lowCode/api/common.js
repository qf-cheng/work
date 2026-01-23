import axios from "axios";

const client = axios.create({
  baseURL: "/api/v2/LC",
  timeout: 15000,
});

// 返回数据示例
// {
//     "code": "000",
//     "message": "成功！",
//     "data": {
//         "ok": true,
//         "data": {
//             "pagination": {
//                 "pageNo": 1,
//                 "pageSize": 1,
//                 "total": 0
//             },
//             "docs": []
//         },
//         "error": null
//     }
// }
function unwrap(data) {
  // 后端返回：{ code, message, data: { ok, data, error } }
  const payload = data?.data;
  if (payload?.ok === false) {
    const msg = payload?.error?.message || "request failed";
    const err = new Error(msg);
    err.payload = data;
    throw err;
  }
  return payload?.data;
}

// 后端路由类似：/lowcode/:resource  (GET list)
export async function listResource(resourceName, { pageNo = 1, pageSize = 20, condition = {} } = {}) {
  const params = {
    pageNo,
    pageSize,
    condition: JSON.stringify(condition),
  };
  const { data } = await client.get(`/lowCode/${encodeURIComponent(resourceName)}`, { params });
  // 兼容 res.ok 包装：{ ok:true, data: ... } 或直接返回
  return unwrap(data);
}

// 后端：GET /lowcode/resources
export async function listResources() {
  const { data } = await client.get(`/lowCode/resources`);
  return unwrap(data);
}

export async function detailResource(resourceName, id) {
  const { data } = await client.get(`/lowcode/${encodeURIComponent(resourceName)}/${encodeURIComponent(id)}`);
  return unwrap(data);
}

export async function createResource(resourceName, doc) {
  const { data } = await client.post(`/lowcode/${encodeURIComponent(resourceName)}`, doc);
  return unwrap(data);
}

export async function updateResource(resourceName, id, patch) {
  const { data } = await client.patch(`/lowcode/${encodeURIComponent(resourceName)}/${encodeURIComponent(id)}`, patch);
  return unwrap(data);
}

export async function removeResource(resourceName, id) {
  const { data } = await client.delete(`/lowcode/${encodeURIComponent(resourceName)}/${encodeURIComponent(id)}`);
  return unwrap(data);
}

// （可选）加载页面：可以做 GET /lowcode/page?condition=...
export async function getPageByName(pageName) {
  const res = await listResource("page", { pageNo: 1, pageSize: 1, condition: { name: pageName } });
  // 这里假设 service.list 返回 { list:[], total } 或类似
  const list = res?.list || res?.data?.list || res?.items || [];
  return list[0] || null;
}
