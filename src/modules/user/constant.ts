export enum loginError {
  NOT_ACCOUNT = '该账号不存在',
  ACCOUNT_OR_PWD_ERROR = '账号或者密码不正确',
  ACCOUNT_EXIST = '该账号已经存在',
}

export enum registerError {
  EMAIL_CODE_ERROR = '验证码错误',
}

export enum updateResponseMessage {
  UPDATE_ERROR = '修改资料失败，请稍后再试',
  UPDATE_SUUCCESS = '修改成功！',
}

export const SYSTEM_ERROR = '系统繁忙，请稍后再试';

export const REGISTER_SUCCESS = '注册成功';

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
