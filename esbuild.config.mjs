import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

const localesPlugin = {
  name: 'locales',
  setup(build) {
    build.onResolve({ filter: /^virtual:locales$/ }, (args) => ({
      path: args.path,
      namespace: 'locales',
    }));
    build.onLoad({ filter: /.*/, namespace: 'locales' }, () => {
      const localesDir = path.resolve(__dirname, 'locales');
      const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));
      const data = {};
      for (const file of files) {
        const key = path.basename(file, '.json');
        data[key] = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf-8'));
      }
      return {
        contents: `export default ${JSON.stringify(data)}`,
        loader: 'js',
      };
    });
  },
};

async function build() {
  const ctx = await esbuild.context({
    entryPoints: ['src/main.ts'],
    bundle: true,
    outfile: 'main.js',
    format: 'cjs',
    target: 'ES2020',
    platform: 'browser',
    external: ['obsidian'],
    plugins: [localesPlugin],
    logLevel: 'info',
    sourcemap: 'inline',
    treeShaking: true,
  });

  if (isWatch) {
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await ctx.rebuild();
    console.log('Build complete');
    await ctx.dispose();
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
