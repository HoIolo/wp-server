// 响应code
export enum code {
  // 成功
  SUCCESS = 1001,
  // 无效参数
  INVALID_PARAMS = 1002,
  // 系统出错
  SYSTEM_ERROR = 1050,
}

// 元数据
export enum metadata {
  ROLE = 'role',
}

export enum roles {
  // 游客
  VISITOR = 0,
  // 登录用户
  LOGGED = 1,
  // 管理员
  ADMIN = 2,
  // 超级管理员
  SUPER_Admin = 3,
}
