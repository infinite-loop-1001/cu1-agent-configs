---
name: java-coding-standards
description: Java 编码规范，涵盖命名、不可变性、Optional 使用、Stream、异常处理、泛型及项目结构。
user-invocable: true
---

# Java 编码规范

适用于 Java 17+ 项目的编码规范。优先可读性而非炫技，默认不可变，快速失败并给出清晰的异常信息，保持命名和包结构一致。

---

## 触发条件

- 编写或审查 Java 代码
- 执行命名和异常处理规范
- 使用 Java 17+ 特性（密封类、模式匹配、Record）
- 审查 Optional / Stream / 泛型的使用
- 组织包结构和项目布局

---

## 命名规范

| 类型 | 风格 | 示例 |
|------|------|------|
| 类 / Record / 接口 | PascalCase | `MarketService`, `Money`, `OrderProcessor` |
| 方法 / 字段 | camelCase | `findBySlug`, `totalAmount` |
| 常量 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| 包名 | 全小写，点分隔 | `com.example.app.domain` |

---

## 不可变性

- 优先使用 Lombok `@Value` 注解生成不可变类
- 无 Lombok 时使用手写不可变类（`private final` 字段 + 全参构造 + getter）
- 不推荐 Record 作为公开 API 的返回类型或持久化对象——第三方库（序列化、ORM）对 Record 支持参差不齐
- 集合字段返回不可变视图或副本

```java
// 推荐：Lombok @Value
@Value
public class Market {
    String slug;
    String name;
}

// 无 Lombok 时的回退方案
@EqualsAndHashCode
@ToString
public class Market {
    private final String slug;
    private final String name;

    public Market(String slug, String name) {
        this.slug = slug;
        this.name = name;
    }

    public String getSlug() { return slug; }
    public String getName() { return name; }
}
```

---

## Optional 使用

Optional 仅用于**方法内部**的链式判空操作，不得作为入参或出参。

- **禁止** Optional 作为方法参数类型
- **禁止** Optional 作为方法返回类型
- **禁止** Optional 作为字段类型
- 在方法内部使用 `Optional.ofNullable()` / `map` / `flatMap` / `filter` 组合链式判空逻辑
- `orElseThrow` 可以抛出业务异常，但要在方法体内完成，不跨越方法边界

```java
// 正确：Optional 仅在内部使用，边界处拆包
public String getMarketName(String slug) {
    return Optional.ofNullable(repo.find(slug))
        .map(Market::getName)
        .orElseThrow(() -> new MarketNotFoundException(slug));
}

// 错误：Optional 作为出参
public Optional<Market> findBySlug(String slug) { ... }
```

---

## Stream 最佳实践

- 转换操作用 Stream，副作用操作用 for 循环
- 使用 `filter(Objects::nonNull)` 过滤空值
- 收集使用 `toList()`（Java 16+）
- 复杂嵌套逻辑改用 for 循环保证可读性
- 避免在 Stream 中抛出受检异常

```java
// 推荐
var names = markets.stream()
    .map(Market::getSlug)
    .filter(Objects::nonNull)
    .toList();

// 复杂逻辑改用循环
for (var market : markets) {
    if (market.isActive() && market.hasInventory()) {
        process(market);
    }
}
```

---

## 异常处理

- 领域错误使用非受检异常（继承 `RuntimeException`）
- 创建领域专属异常类（如 `MarketNotFoundException`、`InvalidOrderStateException`）
- 异常消息包含关键上下文（如 ID、状态值）
- 避免宽泛的 `catch (Exception ex)`，除非在系统边界集中日志记录或重新抛出
- 提供有意义的异常消息，不暴露敏感信息

```java
public class MarketNotFoundException extends RuntimeException {
    public MarketNotFoundException(String slug) {
        super("market not found: slug=" + slug);
    }
}
```

---

## 泛型与类型安全

- 禁止裸类型，始终声明泛型参数
- 可复用工具方法优先使用有界泛型
- 使用 `@SuppressWarnings("unchecked")` 时添加注释说明原因

```java
// 禁止
List list = new ArrayList();

// 推荐
List<Market> markets = new ArrayList<>();

// 有界泛型
public <T extends Identifiable> T findById(List<T> items, Long id) {
    return items.stream()
        .filter(i -> i.getId().equals(id))
        .findFirst()
        .orElseThrow(() -> new NotFoundException("id=" + id));
}
```

---

## 项目结构（Maven / Gradle）

```
src/
├── main/java/<package>/
│   ├── domain/          # 领域模型、实体、值对象
│   ├── service/         # 业务逻辑
│   ├── repository/      # 数据访问接口
│   └── util/            # 工具类
├── main/resources/      # 配置文件、资源
└── test/java/<package>/ # 镜像 main 结构
```

核心原则：按功能职责分包，而非按技术层强制分层。小型项目不必过度拆分。

---

## 格式化与风格

- 统一缩进（4 空格，项目内一致即可）
- 每个文件一个顶层公共类型
- 方法保持简短专注，需要时提取辅助方法
- 成员排序：常量 → 字段 → 构造器 → public 方法 → protected → private
- 遵循项目已有的 `.editorconfig` 或 formatter 配置

---

## 常见代码坏味道

| 问题 | 解决方式 |
|------|----------|
| 长参数列表（>4 个） | 使用参数对象或 Builder 模式 |
| 深层嵌套 | 优先 early return / guard clause |
| 魔法数字、魔法字符串 | 使用命名常量或枚举 |
| 静态可变状态 | 避免全局状态，需要时通过构造器注入 |
| 空 catch 块 | 至少记录日志，或重新抛出 |
| 过长的类/方法 | 按单一职责拆分 |

---

## 日志

使用 SLF4J 作为日志门面。

```java
private static final Logger log = LoggerFactory.getLogger(MyClass.class);

log.info("fetch_market slug={}", slug);
log.error("failed_fetch_market slug={}", slug, ex);
```

- 日志消息采用 `key=value` 风格，便于后续检索
- 异常作为最后一个参数传入，不要直接拼字符串

---

## 空值处理

- 方法返回尽量不返回 null（返回空集合或 Null Object）
- 参数接收方使用 `Objects.requireNonNull` 快速失败
- 仅在需要与外部 API 区分"未设置"和"设置为空"时使用 `@Nullable`

```java
public void process(Order order) {
    Objects.requireNonNull(order, "order must not be null");
    // ...
}
```

---

## 核心原则

1. 代码意图明确，类型安全，可观测
2. 优先可维护性，而非微优化（除非有证据表明优化必要）
3. 保持简洁 —— 可读性优于炫技
