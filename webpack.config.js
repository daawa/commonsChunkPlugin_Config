
// example1

// var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
// module.exports = {
//   entry:
//   {
//     main:process.cwd()+'/example1/main.js',
//   },
//   output: {
//     path:process.cwd()+'/dest/example1',
//     filename: '[name].output.js'
//   },
//   devtool:'cheap-source-map',
//
//   plugins: [
//    new CommonsChunkPlugin({
//        name:"chunk",
//        minChunks:2
//    })
//   ]
// };



// example2

// var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
// module.exports = {
//   entry:
//   {
//       main0:process.cwd()+'/example2/main0.js',
//       main:process.cwd()+'/example2/main.js',
//       main1:process.cwd()+'/example2/main1.js',
//   },
//   output: {
//     path:process.cwd()+'/dest/example2',
//     filename: '[name].output.js'
//   },
//   plugins: [
//    new CommonsChunkPlugin({
//        name:"chunk",
//        minChunks:3
//    })
//   ]
// };



// example3

// let HtmlWebpackPlugin = require('html-webpack-plugin');
// let CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
// module.exports = {
//     entry: {
//         main: process.cwd()+'/example3/main.js',
//         main1: process.cwd()+'/example3/main1.js',
//         module1:process.cwd()+'/example3/module1.js',
//         jquery:"jquery",
//         vue:["vue"]
//     },
//     output: {
//         path: process.cwd()+'/dest/example3',
//         filename: '[name].entry.js'
//     },
//     plugins: [
//       new HtmlWebpackPlugin({
//         inject: true,
//         chunks: ['main'],
//         filename: 'index.main.html'
//       }),
//       new HtmlWebpackPlugin({
//         inject: true,
//         chunks: ['manifest','chunk','main1'],
//         filename: 'index.main1.html'
//       }),
//
//       new CommonsChunkPlugin({
//         names: ["mylib", 'jquery','vue','load'],
//         filename:'[name].common.js',
//         minChunks:2
//       })
//     ]
// };



// example4

// let HtmlWebpackPlugin = require('html-webpack-plugin');
// let CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
// module.exports = {
//     entry: {
//         main: process.cwd()+'/example3/main.js',
//         main1: process.cwd()+'/example3/main1.js',
//         module1:process.cwd()+'/example3/module1.js',
//         module3:process.cwd()+'/example3/module3.js',
//         jquery:"jquery",
//         vue:["vue"]
//     },
//     output: {
//         path: process.cwd()+'/dest/example3',
//         filename: '[name].entry.js'
//     },
//     plugins: [
//       new CommonsChunkPlugin({
//         names: ["mylib", "module1","module3"'jquery','vue','load'],
//         filename:'[name].common.js',
//         minChunks:2
//       })
//     ]
// };


//example5

// let CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
// module.exports = {
//     entry: {
//         main: process.cwd()+'/example5/main.js',
//         main1: process.cwd()+'/example5/main1.js',
//         jquery:["jquery"]
//     },
//     output: {
//         path: process.cwd() + '/dest/example5',
//         filename: '[name].entry.js'
//     },
//     plugins: [
//         new CommonsChunkPlugin({
//             name: "jquery",
//             filename:"[name].common.js",
//             // minChunks:2
//              minChunks:Infinity
//
//         })
//     ]
// };


//example6

// var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
// module.exports = {
//     entry: {
//         main: process.cwd()+'/example6/main.js',
//         main1: process.cwd()+'/example6/main1.js',
//         jquery:["jquery"]
//     },
//     output: {
//         path: process.cwd()  + '/dest/example6',
//         filename: '[name].output.js'
//     },
//     plugins: [
//         new CommonsChunkPlugin({
//             name: "jquery",

//             minChunks:2,

//             chunks:["main","main1"]

//         })
//     ]
// };



//library和libraryTarget与externals使用配置，见相应的文件夹或阅读[https://github.com/zhengweikeng/blog/issues/10]
// module.exports = {
//   entry: { myTools: process.cwd()+"/library_libraryTarget_externals_usage/tool.js" },
//   output: {
//     path:process.cwd()  + '/dest/library_libaryTarget_externals_usage',
//     filename: '[name].output.js',
//     chunkFilename: "[name].min.js",//chunkFilename只有在使用require.ensure时候有用(http://www.cnblogs.com/toward-the-sun/p/6147324.html?utm_source=itdadao&utm_medium=referral)
//     libraryTarget: "var",
//     library: "tool"
//   }
// }


// example8  chunks

// var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
// var ManifestPlugin = require('webpack-manifest-plugin');
// module.exports = {
//     entry: {
//         main: process.cwd()+'/example8/main.js',
//         main1: process.cwd()+'/example8/main1.js'
//     },
//     output: {
//         path: process.cwd()  + '/dest/example8',
//         filename: '[name].output.js'
//     },
//     plugins: [
//         new ManifestPlugin(),
//         new CommonsChunkPlugin({
//             name: "common",
//             minChunks:2,
//             chunks:["main","main1"]

//         })
//     ]
// };

//chunk-module-assets例子

var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
var FileListPlugin = require('./chunk-module-assets/FileListPlugin');
var ManifestPlugin = require('webpack-manifest-plugin');
module.exports = {
    entry: {
        main: process.cwd()+'/chunk-module-assets/main.js',
        main1: process.cwd()+'/chunk-module-assets/main1.js',
    },
    output: {
        path: process.cwd()  + '/dest/chunk-module-assets',
        filename: '[name].output.js'
    },
    module:{
      rules:[
      {
          test: /\.(png|jpg|jpeg|gif)(\?v=\d+\.\d+\.\d+)?$/i,
          use: {
            loader: require.resolve("url-loader"),
            //If the file is greater than the limit (in bytes) the file-loader is used and all query parameters are passed to it.
            //smaller than 10kb will use dataURL
            options: {
              limit: 10000
            }
          }
        }]
    },
    plugins: [
       new FileListPlugin(),
       new ManifestPlugin()
    ]
};
