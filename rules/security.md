# 安全要求

## 输入验证

- 所有用户输入必须验证
- 使用 JSR-380（Bean Validation）注解
- SQL 查询使用参数化查询或 JPQL

## 敏感数据

- 密码必须使用 BCrypt 加密
- API 密钥和密钥存储在环境变量中
- 日志中不得输出敏感信息

## 依赖安全

- 定期运行 `mvn dependency:check`
- 及时更新有漏洞的依赖

## 常见防护

- XSS：对输出进行 HTML 转义
- CSRF：启用 Spring Security CSRF 保护
- SQL 注入：使用 JPA Repository 方法
