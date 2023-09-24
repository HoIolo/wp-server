// 创建文章规则
export const createArticleRules = {
  title: {
    // 最小长度为 5
    MIN_LENGTH: 5,
    // 最大长度为 20
    MAX_LENGTH: 20,
  },
  description: {
    MAX_LENGTH: 200,
  },
};

// 新增文章响应提示
export const CREATE_ARTICLE_RESPONSE = {
  SUCCESS: '新增成功！',
  FAIL: '新增失败，系统繁忙，请稍后再试！',
  PARAMS_ERROR: '参数错误，请重新提交！',
};
