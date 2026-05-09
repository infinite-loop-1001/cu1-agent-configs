# 测试规范

## 测试框架

- Spock（基于 Groovy）
- 内建 Mock / Stub / Spy，无需额外 Mock 框架
- 内建丰富断言能力，无需额外断言库

## 测试命名规范

- 测试类：`{被测类}Spec`
- 测试方法（feature）：`should {预期行为} when {条件}`

## 测试结构

```groovy
class UserServiceSpec extends Specification {

    def "should return user when id exists"() {
        given:
        Long userId = 1L
        User expectedUser = new User(userId, "John")
        userRepository.findById(userId) >> Optional.of(expectedUser)

        when:
        User actualUser = userService.getUserById(userId)

        then:
        actualUser != null
        actualUser.id == userId
    }
}
```

## Mock 与 Stub

Spock 内建 `Mock()`、`Stub()`、`Spy()`。交互验证使用 `N * mock.method()` 语法。

```groovy
def "should send notification once when order is placed"() {
    given:
    def notifier = Mock(Notifier)
    def service = new OrderService(notifier)

    when:
    service.placeOrder(new Order("A001"))

    then:
    1 * notifier.send("Order placed: A001")
}
```

## 异常断言

使用 `thrown()` 断言期望的异常类型。

```groovy
def "should throw exception when user not found"() {
    given:
    userRepository.findById(99L) >> Optional.empty()

    when:
    userService.getUserById(99L)

    then:
    thrown(IllegalArgumentException)
}
```

## 数据驱动测试

使用 `where:` 块实现参数化测试。

```groovy
def "should calculate discount correctly"() {
    expect:
    calculator.discount(amount) == expected

    where:
    amount | expected
    100    | 10
    200    | 20
    0      | 0
}
```
