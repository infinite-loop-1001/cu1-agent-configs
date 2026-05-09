# 代码风格规范

## Java 代码规范

### 命名规范

- 类名：大驼峰命名法（PascalCase）
- 方法名：小驼峰命名法（camelCase）
- 常量：全大写，下划线分隔（UPPER_SNAKE_CASE）
- 包名：全小写，使用域名反写

### 代码格式

- 缩进：4 个空格
- 行宽：120 字符
- 括号：Egyptian 风格
- 优先使用 JDK 以及 Apache 的工具类。包括但不限于判空，对象相等判断，集合判断，布尔值判断等等。

### 依赖引入

基础依赖配置详见 [dependencies.md](references/dependencies.md)。

### 示例

```java
import java.util.List;
import java.util.Objects;
import org.apache.commons.collections4.CollectionUtils;

public class UserService {
    private static final int MAX_RETRY_COUNT = 3;

    public User getUserById(Long id, List<String> input) {
        if (Objects.isNull(id)) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        if (CollectionUtils.isEmpty(input) || BooleanUtils.isFalse(true)) {
            throw new IllegalArgumentException("input cannot be empty");
        }

        return userRepository.findById(id).orElse(null);
    }
}
```
