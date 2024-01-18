export enum loginError {
  NOT_ACCOUNT = '该账号不存在',
  ACCOUNT_OR_PWD_ERROR = '账号或者密码不正确',
  ACCOUNT_EXIST = '该账号已经存在',
}

export enum PROHIBITED_MESSAGE {
  NOT_EXIST = '用户不存在',
  PROHIBITED_SUCCESS = '封禁成功！',
  RELEASE_PROHIBITED_SUCCESS = '解封成功！',
}

export enum GetUserResponseMessage {
  USER_NOT_FOND = '用户不存在',
  SUCCESS = '获取用户成功',
  PARAMS_ERROR = '参数错误',
}

export enum registerError {
  EMAIL_CODE_ERROR = '验证码错误',
}

export enum updatePwdError {
  CHECKCODE_ERROR = '邮箱验证失败,验证码错误！',
  OLDPWD_ERROR = '旧密码错误！',
  NEWPWD_SAMILE_OLDPWD = '新密码不能与旧密码相同',
  USER_NOT_FOND = '用户不存在',
}

export enum updatePwdMessage {
  SUCCESS = '修改成功！',
}

export enum updateResponseMessage {
  UPDATE_ERROR = '修改资料失败，请稍后再试',
  UPDATE_SUUCCESS = '修改成功！',
}

export const USER_NOT_LOGIN = '用户未登录！';

export const SYSTEM_ERROR = '系统繁忙，请稍后再试';

export const REGISTER_SUCCESS = '注册成功';

export const COMMON_UPDATE_SUCCESS = '修改成功！';

export const COMMON_DELETE_SUCCESS = '删除成功！';

// 用户资料规则
export const userProfileRules = {
  username: {
    // 最小长度为 3
    MIN_LENGTH: 2,
    // 最大长度为 5
    MAX_LENGTH: 5,
  },
  usersign: {
    MAX_LENGTH: 200,
  },
  usersex: {
    // 保密
    private: 0,
    // 男性
    men: 1,
    // 女性
    women: 2,
  },
};

export type usersex = 0 | 1 | 2;
