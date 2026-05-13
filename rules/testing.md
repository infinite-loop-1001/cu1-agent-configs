# 测试规范

## 测试方法论

### RED-GREEN-REFACTOR 循环

1. **RED** — 先写失败测试，验证所有新测试均失败
2. **GREEN** — 用最少代码使测试通过，不优化、不重构
3. **REFACTOR** — 绿灯下清理代码，每次改动后重跑测试

### 宪法规则

1. **先设计测试，再写代码** — 从需求出发规划所有测试用例，迭代式逐个编写
2. **RED 必须在 GREEN 之前** — 新测试必须先失败，再写实现。如果测试直接通过，要么测试写错了，要么行为已存在
3. **错误路径优先** — 先写错误处理测试，再写正常路径
4. **一次一个测试** — 写一个失败测试 → 使其通过 → 重构，再写下一个
5. **只在绿灯下重构** — 有失败测试时绝不重构

### 禁止项

- 测试实现细节（内部结构），而非行为
- 跳过 RED 阶段（测试从不失败等于没测）
- Mock 核心领域逻辑（只 mock 外部依赖）
- 部分 mock（spy）—— 需要 spy 意味着设计有问题
- 空 catch 的测试或空断言
- 测试中使用 `Thread.sleep` 等待条件
- 100% 覆盖率强迫症 —— 覆盖率不等于质量

### 测试替身

| 替身 | 用途 | 方式 |
|------|------|------|
| Stub | 返回预设数据，验证状态（结果） | 状态断言 |
| Mock | 验证交互是否被调用及调用次数 | 交互验证 |
| Fake | 可工作的轻量实现（如内存版 Repository） | 行为等价 |
| Spy | 记录调用同时保留真实行为 | 不推荐，优先重构设计 |

### 测试覆盖顺序

1. **异常路径** — 非法输入、依赖失败、资源不存在
2. **边界条件** — 空集合、零值、最大值、null
3. **正常路径** — 主干业务逻辑

### 覆盖率与变异测试

- 行覆盖率目标 >= 80%（非阻塞门禁）
- 变异测试使用 PIT（pitest），得分作为审查参考，不设强制阈值

---

## 测试框架

Java 项目统一使用 **Spock**（基于 Groovy），无需额外 Mock 框架或断言库。

| 类别 | 工具 |
|------|------|
| 单元测试 | Spock |
| 属性测试 | jqwik |
| 覆盖率 | JaCoCo |
| 变异测试 | PIT (pitest) |

---

## 测试命名

- 测试类：`{被测类}Spec`，继承 `spock.lang.Specification`
- 测试方法：`"should {行为} when {条件}"` 字符串描述
- 包路径：`src/test/groovy/` 下镜像 main 结构

---

## 测试结构（given / when / then）

```groovy
class OrderServiceSpec extends Specification {

    def "should place order and notify when stock is sufficient"() {
        given:
        def notifier = Mock(Notifier)
        def repo = Mock(OrderRepository)
        def service = new OrderService(repo, notifier)

        when:
        service.placeOrder(new Order("A001"))

        then:
        1 * repo.save(_)
        1 * notifier.send("Order placed: A001")
    }
}
```

---

## Mock 与 Stub

Spock 内建 `Mock()`、`Stub()`、`Spy()`。只 mock 外部依赖（数据库、HTTP 客户端、消息队列），不 mock 领域逻辑。

```groovy
// Stub — 预设返回值
def "should return order when id exists"() {
    given:
    def repo = Stub(OrderRepository)
    repo.findById(1L) >> Optional.of(new Order("A001"))
    def service = new OrderService(repo)

    when:
    def result = service.findById(1L)

    then:
    result.id == "A001"
}

// Mock — 验证交互
def "should notify once when order is placed"() {
    given:
    def notifier = Mock(Notifier)
    def service = new OrderService(notifier)

    when:
    service.placeOrder(new Order("A001"))

    then:
    1 * notifier.send("Order placed: A001")   // 期望调用恰好 1 次
}
```

交互验证语法：

| 语法 | 含义 |
|------|------|
| `N * mock.method(args)` | 期望调用 N 次 |
| `(N..M) * mock.method(args)` | 期望调用 N 到 M 次 |
| `0 * mock.method(_)` | 期望从不调用 |
| `_ * mock.method(_)` | 任意次（包括 0 次） |

---

## 异常断言

```groovy
def "should throw exception when order not found"() {
    given:
    def repo = Stub(OrderRepository)
    repo.findById(99L) >> Optional.empty()
    def service = new OrderService(repo)

    when:
    service.findById(99L)

    then:
    thrown(OrderNotFoundException)
}
```

---

## 数据驱动测试

使用 `where:` 块实现参数化测试，一行数据即一个测试用例。

```groovy
def "should calculate discount correctly"(int amount, int expected) {
    expect:
    calculator.discount(amount) == expected

    where:
    amount | expected
    100    | 10
    200    | 20
    0      | 0
}

def "should throw when withdraw exceeds balance"(int balance, int amount) {
    given:
    def account = new Account(balance)

    when:
    account.withdraw(amount)

    then:
    def e = thrown(IllegalArgumentException)
    e.message.contains("insufficient")

    where:
    balance | amount
    100     | 101
    50      | 51
    0       | 1
}
```
