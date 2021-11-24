import path from 'path'
import babel from '@rollup/plugin-babel'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import jsx from 'acorn-jsx'
import esbuild from 'rollup-plugin-esbuild'
const createBabelConfig = require('./babel.config')

const extensions = ['.js', '.ts', '.tsx']
const { root } = path.parse(process.cwd())

function external(id) {
  return !id.startsWith('.') && !id.startsWith(root)
}

function getBabelOptions(targets) {
  return {
    ...createBabelConfig({ env: (env) => env === 'build' }, targets),
    extensions,
    comments: false,
    babelHelpers: 'bundled',
  }
}

function getEsbuild(target) {
  return esbuild({
    minify: false,
    target,
    tsconfig: path.resolve('./tsconfig.json'),
  })
}

function createDeclarationConfig(input, output) {
  return {
    input,
    output: {
      dir: output,
    },
    external,
    acornInjectPlugins: [jsx()],
    plugins: [
      typescript({
        declaration: true,
        emitDeclarationOnly: true,
        outDir: output,
      }),
    ],
  }
}

function createESMConfig(input, output) {
  return {
    input,
    output: [
      { file: `${output}.js`, format: 'esm' },
      { file: `${output}.mjs`, format: 'esm' },
    ],
    external,
    plugins: [
      nodeResolve({ extensions }),
      getEsbuild('node14'),
    ],
  }
}

function createCommonJSConfig(input, output) {
  return {
    input,
    output: { file: output, format: 'cjs', exports: 'named' },
    external,
    acornInjectPlugins: [jsx()],
    plugins: [
      nodeResolve({ extensions }),
      typescript(),
      babel(getBabelOptions({ ie: 11 })),
    ],
  }
}

export default function (args) {
  return [
    createDeclarationConfig('src/index.tsx', 'dist'),
    createCommonJSConfig('src/index.tsx', 'dist/index.js'),
    createESMConfig('src/index.tsx', 'dist/esm/index'),
  ]
}
