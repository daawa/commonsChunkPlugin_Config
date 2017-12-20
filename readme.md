# CommonsChunkplugin插件的使用
这篇文章告诉了我们CommonsChunkPlugin插件是如何使用的，其详细论述了每一个参数的具体用法以及某几个参数结合起来的作用。但是，如果你对CommonsChunkPlugin的打包原理比较感兴趣，你可以阅读我的[这篇文章](https://github.com/liangklfangl/commonchunkplugin-source-code),其以图解的方式进行了详细论述。

## 1.单入口文件时候不能把引用多次的模块打印到commonChunkPlugin中

>注意：`example1`(对应于目录`example1`，修改`webpack.config.js`中的配置就可以了，以下例子相同)


```js
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
module.exports = {
  entry:
  {
    main:process.cwd()+'/example1/main.js',
  },
  output: {
    path:process.cwd()+'/dest/example1',
    filename: '[name].output.js'
  },
  devtool:'cheap-source-map',

  plugins: [
   new CommonsChunkPlugin({
       name:"chunk",
       minChunks:2
   })
  ]
};
```

虽然在example1中`module2`被引用了两次（`main` 和 `module1` ），但是最终并没有打包到`chunk.js`中，

**这是因为 `module1` 被 `main` 引用，`module1` 会被打包到 `main`的chunk 文件(`main.out.js`) 中， 然后 `module1`的chunk 文件 `module1.js` 就 *`不存在`* 了, 那么 `module2` 其实只被 `main` 这一个chunk 引用了**

> 此时 `chunk.js` 只有 webpack 的运行时代码。


打包成的main.output.js中内容包含了 module1.js、module2.js 和 main.js 的内容

```js
webpackJsonp([0,1],[
/* 0 */
/***/ (function(module, exports) {


exports.module2=2;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(0);

exports.module1=1;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
__webpack_require__(0);
console.log('main1.');


/***/ })
],[2]);
//# sourceMappingURL=main.output.js.map
```

<br/>

## 2. 多入口文件时候能把引用多次的模块打印到commonChunkPlugin中

在example2中我们配置了如下:

```js
minChunks:2
```

example2 有两个入口 `main` 和 `main1`（所以此时确定至少有两个chunk，对应的文件分别是 `main.output.js` 和 `main1.output.js`)。

main 和 main1 都依赖了 `module1`， 所以`module1`会打包到 common chunk 中（根据配置，此时的common chunk 文件是 `chunk.output.js`)，`module2` 被 main、main1 以及common chunk 三个chunk依赖，所以也会打包到common chunk中. 其实此时即使 `main` 和 `main1` 不依赖`module2`， `module2` 也会随`module1` 一同打包进 common chunk.

>common chunk 之所以依赖 module2， 是因为module1 依赖module2， 而module2在common chunk中
>

<br/>

## 3. 将公共业务模块与类库或框架分开打包

```js
let HtmlWebpackPlugin = require('html-webpack-plugin');
let CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
module.exports = {
    entry: {
        main: process.cwd()+'/example3/main.js',
        main1: process.cwd()+'/example3/main1.js',
        module1:process.cwd()+'/example3/module1.js',
        jquery:"jquery",
        vue:["vue"]
    },
    output: {
        path: process.cwd()+'/dest/example3',
        filename: '[name].entry.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        inject: true,
        chunks: ['main'],
        filename: 'index.main.html'
      }),
      new HtmlWebpackPlugin({
        inject: true,
        chunks: ['manifest','chunk','main1'],
        filename: 'index.main1.html'
      }),

      new CommonsChunkPlugin({
        names: ["chunk", 'jquery', 'vue', 'load'],
        filename:'[name].common.js',
        minChunks:2
      })
    ]
};


```
上面的配置是如何工作的呢？ 

根据 entry 的配置， 首先（临时）生成了 
	
- `main.entry.js` -> `main`
- `main1.entry.js` -> `main1`
- `jquery.entry.js` -> `jquery`
- `vue.entry.js` -> `vue`
- `module1.entry.js` -> `module1`


5 个 **`entry`** 类型的chunk 文件,




在 CCP 中定义的chunk, 除去第一个和最后一个chunk外，如果还有其它chunk， 则检测其name是否存在于 webpack.entry 定义的chunk中， 如果在，将其打包进CommonsChunkPlugin定义的chunk文件， 这个例子中则是把 `jquery.output.js` 打包进 `jquery.common.js`， 把 `vue.output.js` 打包进 `vue.common.js`， 并把相应的entry的类型的chunk删掉。

现在我们有 5 个 chunk 文件， 前3个是 **`entry`** 类型的，后2个是 **`common`** 类型的：

- `main.entry.js` -> `main`
- `main1.entry.js` -> `main1`
- `module1.entry.js` -> `module1`

- `jquery.common.js` -> `jquery`
- `vue.common.js` -> `vue`


接下来 CCP 把 这 5 个 chunk 中符合要求的`module` 抽出来，没有被common类型chunk（这里值 `jquery` 和 `vue`）依赖的module打包进 `CommonsChunkPlugin`  配置的第一个chunk， 即 `mylib` ， **所以 `main`、`main1`、`module1` 三个 *chunk* 依赖的 `module1`、`module2` 两个 *module* 都抽取到 `mylib` 这个 *chunk* 了**。

> 你会发现 `module1.entry.js` 只剩一行代码了：
> 
> ```js
>  webpackJsonp([5,6],[],[1]);
> ``` 

被common类型chunk依赖的公共module保留在原来的common chunk中（比如， 被jquery依赖的公共module保留在jquery， 被vue依赖的公共module保留在vue， 如果jquery 和 vue 也有共同依赖，且minChunks 满足要求，则保留其中一个），

经过处理，现在多了一个 common 类型的 `mylib` chunk, `mylib` 包含 `module1` 和 `module2` 两个 module.

- `main.entry.js` -> `main`
- `main1.entry.js` -> `main1`
- `module1.entry.js` -> `module1` (这里指 **`chunk`**, 不要和那个名叫 *module1* 这个 **`module`**混淆）

- `jquery.common.js` -> `jquery`
- `vue.common.js` -> `vue`
- `mylib.common.js` --> `mylib`

最后，webpack的`runtime code` 打包近最后一个chunk， 即 `load` ,

- `main.entry.js` -> `main`
- `main1.entry.js` -> `main1`
- `module1.entry.js` -> `module1` (这里指 **`chunk`**, 不要和那个名叫 *module1* 这个 **`module`**混淆）

- `jquery.common.js` -> `jquery`
- `vue.common.js` -> `vue`
- `mylib.common.js` --> `mylib`
- `load.common.js` --> `load`


这就是所有的输出了.

<br/> <br/>

-------------------

> webpack用插件`CommonsChunkPlugin`进行打包的时候，将符合 **`引用次数(minChunks)`** 的模块打包到**`names`**参数的数组的**第一个块**里（chunk）,
> 
> 然后数组后面的块依次打包( 查找`entry`里的 `key`,没有找到相关的`key`就生成一个空的块 )，**最后一个块** 包含webpack生成的在浏览器上使用各个块的加载代码(runtime code)，所以页面上使用的时候最后一个块必须最先加载.
> 


<br/> <br/>

-------------------

这里也区分一下 **`module`** 和 **`chunk`**：

`module1.js` 定义了一个 `module`，

```js
require("./module2");

exports.module1=1;

``` 

但是如果把它作为一个 `entry`， 那么会生成一个`chunk`(生成的chunk文件是 `module1.entry.js`)：

```js
webpackJsonp([3,5],[
/* 0 */
/***/ (function(module, exports) {


exports.module2=2;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(0);

exports.module1=1;


/***/ })
],[1]);

```


由此可知，`chunk` 是定义在 **`webpackJsonp(..)`** 函数中的。

<br/>

由于module1 这个chunk `(对应文件 module1.output.js)` 依赖的 module `module1` 和 `module2` 同时被 main 和 main1 两个chunk 用到， 所以最终被抽出到 `mylib` 这个chunk中了，

而module1 这个chunk 就变成了

```js
webpackJsonp([5,6],[],[1]);
```

<br/><br/>


> 如果在CCP 配置中增加一个 common chunk `module1`， 最后会发现 `mylib` 不见了， 因为 **common chunk** 的依赖优先留在本chunk中，所以 *module*  `module1` 和 `module2` 都留在 `module1.common.js` 中， 而 mylib 这个chunk 就没必要存在了。 *可参考 example4*
> 

<br/><br/>

##todo:

### 参数minChunks: Infinity

下面的配置会把main.js和main1.js公共的业务代码打包到jquery.js中:

```js
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
module.exports = {
    entry: {
        main: process.cwd()+'/example5/main.js',
        main1: process.cwd()+'/example5/main1.js',
        jquery:["jquery"]
        //minChunks: Infinity时候框架代码依然会被单独打包成一个文件
    },
    output: {
        path: process.cwd() + '/dest/example5',
        filename: '[name].js'
    },
    plugins: [
        new CommonsChunkPlugin({
            name: "jquery",
            minChunks:2//被引用两次及以上
        })
    ]
};
```

如果把上面的minChunks修改为Infinity，那么chunk1和chunk2(公有的业务逻辑部分,在main.js和main1.js中require进来)`都打包到main.js,main1.js里`，也就是共有逻辑不会抽取出来作为一个单独的chunk,而且也不会打包到jquery.js中(下面的chunks参数配置可以让共有的模块打包到jquery中)!注意：此处的jquery必须在最先加载，因为window.webpackJsonp函数是被打包到jquery.js中的!

### 参数chunks

下面的配置表示：只有在main.js和main1.js中都引用的模块才会被打包的到公共模块（这里即jquery.js）

```js
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
module.exports = {
    entry: {
        main: process.cwd()+'/example6/main.js',
        main1: process.cwd()+'/example6/main1.js',
        jquery:["jquery"]
    },
    output: {
        path: process.cwd()  + '/dest/example6',
        filename: '[name].js'
    },
    plugins: [
        new CommonsChunkPlugin({
            name: "jquery",
            minChunks:2,
            chunks:["main","main1"]
        })
    ]
};

```


此时你会发现在我们的jquery.js的最后会打包进来我们的chunk1.js和chunk2.js

```js
/* 2 */
/***/ function(module, exports, __webpack_require__) {
  __webpack_require__(3);
  var chunk1=1;
  exports.chunk1=chunk1;

/***/ },
/* 3 */
/***/ function(module, exports) {
  var chunk2=1;
  exports.chunk2=chunk2;

/***/ }
```



<br/><br/><br/><br/>

---------------

## 从 CommonsChunkPlugin 看 Compiler 对象

 首先我们运行example1中的代码，其中webpack配置如下(可以在配置文件中自己打开注释部分):
```js
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
module.exports = {
  entry:
  {
    main:process.cwd()+'/example1/main.js',
  },
  output: {
    path:process.cwd()+'/dest/example1',
    filename: '[name].js'
  },
  plugins: [
   new CommonsChunkPlugin({
       name:"chunk",
       minChunks:2
   })
  ]
};
```

我们看看控制台打印的Compiler对象内容:

```js
Compiler {
  _plugins: {},
  outputPath: '',
  outputFileSystem: null,
  inputFileSystem: null,
  recordsInputPath: null,
  recordsOutputPath: null,
  records: {},
  fileTimestamps: {},
  contextTimestamps: {},
  resolvers:
   { normal: Tapable { _plugins: {}, fileSystem: null },
     loader: Tapable { _plugins: {}, fileSystem: null },
     context: Tapable { _plugins: {}, fileSystem: null } },
  parser:
   Parser {
     _plugins:
      { 'evaluate Literal':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate LogicalExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate BinaryExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate UnaryExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate typeof undefined':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate Identifier':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate MemberExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate CallExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate CallExpression .replace':
         [ { [Function]
             [length]: 2,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate CallExpression .substr':
         [ { [Function]
             [length]: 2,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate CallExpression .substring':
         [ { [Function]
             [length]: 2,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate CallExpression .split':
         [ { [Function]
             [length]: 2,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate ConditionalExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate ArrayExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ] },
     options: undefined },
  options:
   { entry: { main: '/Users/xxx/Desktop/commonsChunkPlugin_Config/example1/main.js' },
     output:
      { path: '/Users/xxx/Desktop/commonsChunkPlugin_Config/dest/example1',
        filename: '[name].js',
        libraryTarget: 'var',
        sourceMapFilename: '[file].map[query]',
        hotUpdateChunkFilename: '[id].[hash].hot-update.js',
        hotUpdateMainFilename: '[hash].hot-update.json',
        crossOriginLoading: false,
        hashFunction: 'md5',
        hashDigest: 'hex',
        hashDigestLength: 20,
        sourcePrefix: '\t',
        devtoolLineToLine: false },
     plugins:
      [ CommonsChunkPlugin {
          chunkNames: 'chunk',
          filenameTemplate: undefined,
          minChunks: 2,
          selectedChunks: undefined,
          async: undefined,
          minSize: undefined,
          ident: '/Users/xxx/Desktop/commonsChunkPlugin_Config/node_modules/webpack/lib/optimize/CommonsChunkPlugin.js0' },
        [length]: 1 ],
     context: '/Users/xxx/Desktop/commonsChunkPlugin_Config',
     debug: false,
     devtool: false,
     cache: true,
     target: 'web',
     node:
      { console: false,
        process: true,
        global: true,
        setImmediate: true,
        __filename: 'mock',
        __dirname: 'mock' },
     resolve:
      { fastUnsafe: [ [length]: 0 ],
        alias: {},
        packageAlias: 'browser',
        modulesDirectories: [ 'web_modules', 'node_modules', [length]: 2 ],
        packageMains:
         [ 'webpack',
           'browser',
           'web',
           'browserify',
           [ 'jam', 'main', [length]: 2 ],
           'main',
           [length]: 6 ],
        extensions: [ '', '.webpack.js', '.web.js', '.js', '.json', [length]: 5 ] },
     resolveLoader:
      { fastUnsafe: [ [length]: 0 ],
        alias: {},
        modulesDirectories:
         [ 'web_loaders',
           'web_modules',
           'node_loaders',
           'node_modules',
           [length]: 4 ],
        packageMains: [ 'webpackLoader', 'webLoader', 'loader', 'main', [length]: 4 ],
        extensions:
         [ '',
           '.webpack-loader.js',
           '.web-loader.js',
           '.loader.js',
           '.js',
           [length]: 5 ],
        moduleTemplates:
         [ '*-webpack-loader',
           '*-web-loader',
           '*-loader',
           '*',
           [length]: 4 ] },
     module:
      { unknownContextRequest: '.',
        unknownContextRecursive: true,
        unknownContextRegExp: { /^\.\/.*$/ [lastIndex]: 0 },
        unknownContextCritical: true,
        exprContextRequest: '.',
        exprContextRegExp: { /^\.\/.*$/ [lastIndex]: 0 },
        exprContextRecursive: true,
        exprContextCritical: true,
        wrappedContextRegExp: { /.*/ [lastIndex]: 0 },
        wrappedContextRecursive: true,
        wrappedContextCritical: false },
     optimize: { occurenceOrderPreferEntry: true } },
  context: '/Users/xxx/Desktop/commonsChunkPlugin_Config' }
```

### 2.1 首先她有一个Parser对象用于对代码进行解析

```js
parser:
   Parser {
     _plugins:
      { 'evaluate Literal':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate LogicalExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate BinaryExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate UnaryExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate typeof undefined':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
     'evaluate Identifier':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate MemberExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate CallExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate CallExpression .replace':
         [ { [Function]
             [length]: 2,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate CallExpression .substr':
         [ { [Function]
             [length]: 2,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate CallExpression .substring':
         [ { [Function]
             [length]: 2,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate CallExpression .split':
         [ { [Function]
             [length]: 2,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate ConditionalExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ],
        'evaluate ArrayExpression':
         [ { [Function]
             [length]: 1,
             [name]: '',
             [arguments]: null,
             [caller]: null,
             [prototype]: { [constructor]: [Circular] } },
           [length]: 1 ] },
     options: undefined }
```

分别有 'evaluate Literal'，'evaluate LogicalExpression'， 'evaluate BinaryExpression'，  'evaluate UnaryExpression'(一元的表达式)，  'evaluate typeof undefined':   'evaluate Identifier':   'evaluate MemberExpression'，'evaluate CallExpression'， 'evaluate CallExpression .replace'， 'evaluate CallExpression .substr'， 'evaluate CallExpression .split'， 'evaluate CallExpression .substring'， 'evaluate ConditionalExpression'， 'evaluate ArrayExpression'其中这些部分都牵涉到对AST的解析。

### 2.2 她有一个Option对象表示webpack配置信息

```js
 options:
   { entry: { main: '/Users/xxx/Desktop/commonsChunkPlugin_Config/example1/main.js' },//entry对象表示我们配置的入口文件
     output:
      { path: '/Users/xxx/Desktop/commonsChunkPlugin_Config/dest/example1',
          //输出路径
        filename: '[name].js',
        //文件名配置
        libraryTarget: 'var',
        //默认设置为变量类型，其他类型参见下面的分析
        sourceMapFilename: '[file].map[query]',
        hotUpdateChunkFilename: '[id].[hash].hot-update.js',
        hotUpdateMainFilename: '[hash].hot-update.json',
        crossOriginLoading: false,
        hashFunction: 'md5',
        hashDigest: 'hex',
        hashDigestLength: 20,
        sourcePrefix: '\t',
        devtoolLineToLine: false },
      //output对象表示输出的配置
     plugins:
     //plugins数组表示配置的plugin数组信息
      [ CommonsChunkPlugin {
          chunkNames: 'chunk',
          filenameTemplate: undefined,
          minChunks: 2,
          selectedChunks: undefined,//
          async: undefined,
          minSize: undefined,
          ident: '/Users/xxx/Desktop/commonsChunkPlugin_Config/node_modules/webpack/lib/optimize/CommonsChunkPlugin.js0' },
        [length]: 1 ],
     //context项目地址
     context: '/Users/xxx/Desktop/commonsChunkPlugin_Config',
     debug: false,
     devtool: false,
     cache: true,
     target: 'web',
     //node
     node:
      { console: false,
        process: true,
        global: true,
        setImmediate: true,
        __filename: 'mock',
        __dirname: 'mock' },
     //resolve对象
     resolve:
      { fastUnsafe: [ [length]: 0 ],
        alias: {},
        packageAlias: 'browser',
        modulesDirectories: [ 'web_modules', 'node_modules', [length]: 2 ],
        packageMains:
         [ 'webpack',
           'browser',
           'web',
           'browserify',
           [ 'jam', 'main', [length]: 2 ],
           'main',
           [length]: 6 ],
        extensions: [ '', '.webpack.js', '.web.js', '.js', '.json', [length]: 5 ] },
     //resolveLoader对象
     resolveLoader:
      { fastUnsafe: [ [length]: 0 ],
        alias: {},
        modulesDirectories:
         [ 'web_loaders',
           'web_modules',
           'node_loaders',
           'node_modules',
           [length]: 4 ],
        packageMains: [ 'webpackLoader', 'webLoader', 'loader', 'main', [length]: 4 ],
        extensions:
         [ '',
           '.webpack-loader.js',
           '.web-loader.js',
           '.loader.js',
           '.js',
           [length]: 5 ],
        moduleTemplates:
         [ '*-webpack-loader',
           '*-web-loader',
           '*-loader',
           '*',
           [length]: 4 ] },
    //module对象
     module:
      { unknownContextRequest: '.',
        unknownContextRecursive: true,
        unknownContextRegExp: { /^\.\/.*$/ [lastIndex]: 0 },
        unknownContextCritical: true,
        exprContextRequest: '.',
        exprContextRegExp: { /^\.\/.*$/ [lastIndex]: 0 },
        exprContextRecursive: true,
        exprContextCritical: true,
        wrappedContextRegExp: { /.*/ [lastIndex]: 0 },
        wrappedContextRecursive: true,
        wrappedContextCritical: false },
     optimize: { occurenceOrderPreferEntry: true } }
```

#### 2.2.1 library和libraryTarget,externals

library和libraryTarget,externals的使用可以参见[webpack中的externals vs libraryTarget vs library](https://github.com/liangklfangl/webpack-external-library)和[webpack中library和libraryTarget与externals的使用](https://github.com/zhengweikeng/blog/issues/10)以及[官方文档](http://webpack.github.io/docs/configuration.html#externals)。通过配置不同的libraryTarget会生成不同umd的代码，例如可以只是commonjs标准的，也可以是指amd标准的，也可以只是通过script标签引入的（参考library_libaryTarget_externals_usage例子），这样就可以满足我们的初始需求:

#### 2.2.2 sourceMapFilename

从上面可以看到是 sourceMapFilename: '[file].map[query]',其在我们的output.path的路径下面。我们给webpack.config.js添加配置：

```js
 devtool:'cheap-source-map'
```

此时你会发现在example1目录下打印出来两个chunk对应的sourceMap文件。如下:

![](./map.png)

通过文件名可以知道file这里对应于我们的chunk.js和main.js的文件名。前者表示commonChunkPlugin提取出来的公共模块，虽然是没有公共模块内容：

```js
/******/ (function(modules) {

  })
/************************************************************************/
/******/ ([]);
//# sourceMappingURL=chunk.js.map
```

后者表示entry中配置的chunk的名称!

#### 2.2.3 hotUpdateChunkFilename










参考资料：

[webpack打包策略分析](https://github.com/liangklfang/webpack_package)

[webpack CommonsChunkPlugin详细教程](https://segmentfault.com/a/1190000006808865)

[webpack中的externals vs libraryTarget vs library](https://github.com/liangklfangl/webpack-external-library)
