import typescript from 'rollup-plugin-typescript2'

export default {
  input: './src/index.tsx',
  output: [
    {
      // dir: 'dist',
      file: 'dist/index.js',
      format: 'cjs',
      // pl
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
  ],
  plugins: [typescript(/*{ plugin options }*/)],
  external: ['react'],
}
