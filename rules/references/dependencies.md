# 基础依赖

本项目所有子模块必须引入以下 Apache Commons 基础依赖。

## commons-lang3

通用工具类库，用于字符串处理、对象判空、布尔判断、数组操作等。

**父 POM（`dependencyManagement` 中声明版本）：**

```xml
<properties>
    <commons-lang3.version>3.14.0</commons-lang3.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>${commons-lang3.version}</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

**子模块（直接引用，不写版本）：**

```xml
<dependencies>
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-lang3</artifactId>
    </dependency>
</dependencies>
```

## commons-collections4

集合工具类库，提供 `CollectionUtils`、`MapUtils` 等集合判空与操作工具。

**父 POM（`dependencyManagement` 中声明版本）：**

```xml
<properties>
    <commons-collections4.version>4.4</commons-collections4.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-collections4</artifactId>
            <version>${commons-collections4.version}</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

**子模块（直接引用，不写版本）：**

```xml
<dependencies>
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-collections4</artifactId>
    </dependency>
</dependencies>
```
