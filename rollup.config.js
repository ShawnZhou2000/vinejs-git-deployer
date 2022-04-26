import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';

export default {
  input: 'index.js', // 入口文件
  output: {
    format: 'cjs',
    file: 'bin/index.js', // 打包后输出文件
  },
  plugins: [
    babel({
      exclude: "node_modules/**"
    }),
    // 压缩代码
    uglify(),
  ]
}