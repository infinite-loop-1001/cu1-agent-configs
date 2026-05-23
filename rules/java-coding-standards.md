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

## 判空与布尔值判断

字符串、空值、集合、布尔值的判断必须使用标准工具类，禁止手写 `== null`、`.isEmpty()` 等散落各处。

**允许的工具类范围**：仅限以下三个来源，禁止使用其他三方工具类。

| 来源 | 依赖 | 适用场景 |
|------|------|---------|
| JDK 自带 | 无需额外依赖 | `java.util.Objects` — 对象判空、requireNonNull、equals |
| Apache Commons Lang | `org.apache.commons:commons-lang3` | 字符串、布尔值、数组、Object 兜底方法 |
| Apache Commons Collections | `org.apache.commons:commons-collections4` | **集合、Map 优先使用此项** |

**各场景使用对照**：

| 场景 | 使用 | 禁止 |
|------|------|------|
| 对象判空 | `Objects.isNull(obj)` / `Objects.nonNull(obj)` | `obj == null` / `obj != null` |
| 对象非空断言 | `Objects.requireNonNull(obj, "msg")` | `if (obj == null) throw ...` |
| 两个对象是否相等（含 null） | `Objects.equals(a, b)` | `a.equals(b)`（可能 NPE） |
| 字符串判空 | `StringUtils.isEmpty(str)` / `StringUtils.isNotEmpty(str)` | `str == null \|\| str.isEmpty()` |
| 字符串判空白 | `StringUtils.isBlank(str)` / `StringUtils.isNotBlank(str)` | `str == null \|\| str.trim().isEmpty()` |
| 字符串判空后提供默认值 | `StringUtils.defaultIfEmpty(str, default)` / `StringUtils.defaultIfBlank(str, default)` | `str != null && !str.isEmpty() ? str : default` |
| 字符串 null → 空串 | `StringUtils.defaultString(str)` | `str == null ? "" : str` |
| 集合判空 | `CollectionUtils.isEmpty(coll)` / `CollectionUtils.isNotEmpty(coll)` | `coll == null \|\| coll.isEmpty()` |
| 集合判空后提供默认值 | `CollectionUtils.emptyIfNull(coll)` | `coll != null ? coll : Collections.emptyList()` |
| 集合并集 | `CollectionUtils.union(a, b)` | 手写 addAll 循环 |
| 集合交集 | `CollectionUtils.intersection(a, b)` | 手写 retainAll 循环 |
| 集合差集 | `CollectionUtils.subtract(a, b)` | 手写 removeAll 循环 |
| 集合是否包含任一 | `CollectionUtils.containsAny(coll, candidates)` | 手写双重循环 |
| 集合过滤 | `CollectionUtils.filter(coll, predicate)` / `CollectionUtils.select(coll, predicate)` | 手写 for + if 构建新列表 |
| 集合转换 | `CollectionUtils.collect(coll, transformer)` | 手写 for + transform 构建新列表 |
| 集合判等（忽略顺序） | `CollectionUtils.isEqualCollection(a, b)` | 手写 containsAll 双向检查 |
| Map 判空 | `MapUtils.isEmpty(map)` / `MapUtils.isNotEmpty(map)` | `map == null \|\| map.isEmpty()` |
| Map 判空后提供默认值 | `MapUtils.emptyIfNull(map)` | `map != null ? map : Collections.emptyMap()` |
| Map 安全取值 | `MapUtils.getObject(map, key)` / `MapUtils.getString(map, key)` | `map.get(key)`（可能 NPE 或类型强转失败） |
| 布尔值判空 | `BooleanUtils.isTrue(bool)` / `BooleanUtils.isFalse(bool)` / `BooleanUtils.isNotTrue(bool)` / `BooleanUtils.isNotFalse(bool)` | `bool != null && bool`（含 NPE 风险） |
| 空数组检查 | `ArrayUtils.isEmpty(arr)` / `ArrayUtils.isNotEmpty(arr)` | `arr == null \|\| arr.length == 0` |
| 获取首个非空值 | `ObjectUtils.firstNonNull(a, b, c)` | 嵌套三元表达式 |

> `CollectionUtils`、`MapUtils`、`ListUtils`、`SetUtils` 来自 **`org.apache.commons.collections4`**。
> 所有集合/Map 的操作（判空、合并、过滤、转换、交集、差集等）优先使用 `commons-collections4` 提供的工具类，禁止手写循环实现已有标准操作。
> `StringUtils`、`BooleanUtils`、`ArrayUtils`、`ObjectUtils` 来自 **`org.apache.commons.lang3`**。

```java
// 正确：使用工具类
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.collections4.ListUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;

if (StringUtils.isBlank(name)) {
    throw new IllegalArgumentException("name must not be blank");
}

// 集合判空 + 默认值
List<Order> orders = CollectionUtils.emptyIfNull(repo.findByUser(userId));
// 集合并集
List<String> all = ListUtils.union(a, b);
// 集合差集
List<String> diff = ListUtils.subtract(all, processed);
// 集合过滤
CollectionUtils.filter(items, item -> item.isActive());

// Map 判空
if (MapUtils.isEmpty(configMap)) {
    return java.util.Collections.emptyMap();
}
// Map 安全取值
String value = MapUtils.getString(params, "timeout", "30");

// 布尔值安全判断
Boolean active = BooleanUtils.isTrue(config.getActive());

// 错误：手写集合操作
if (orders == null || orders.isEmpty()) { ... }                    // 用 CollectionUtils.isEmpty
if (map == null || map.isEmpty()) { ... }                          // 用 MapUtils.isEmpty
List<String> all = new ArrayList<>(a); all.addAll(b);              // 用 ListUtils.union
List<Order> active = new ArrayList<>();
for (Order o : orders) { if (o.isActive()) active.add(o); }        // 用 CollectionUtils.filter
if (config.getActive() != null && config.getActive()) { ... }      // 用 BooleanUtils.isTrue
String v = configMap.get("timeout");                               // 可能 NPE，用 MapUtils.getString
```

## 核心原则

1. 代码意图明确，类型安全，可观测
2. 优先可维护性，而非微优化（除非有证据表明优化必要）
3. 保持简洁 —— 可读性优于炫技
