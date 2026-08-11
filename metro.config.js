// const fs = require('fs');
// const path = require('path');
// const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// /**
//  * Metro configuration
//  * https://reactnative.dev/docs/metro
//  *
//  * @type {import('@react-native/metro-config').MetroConfig}
//  */
// const defaultConfig = getDefaultConfig(__dirname);

// const config = {
//   resolver: {
//     unstable_enablePackageExports: false,
//     resolveRequest: (context, moduleName, platform) => {
//       if (moduleName.startsWith('@babel/runtime/helpers/')) {
//         const rel = moduleName.replace('@babel/runtime/', '');
//         const candidates = [
//           path.join(__dirname, 'node_modules', '@babel', 'runtime', rel),
//           path.join(__dirname, 'node_modules', '@babel', 'runtime', rel + '.js'),
//           path.join(__dirname, 'node_modules', '@babel', 'runtime', rel, 'index.js'),
//         ];

//         for (const candidate of candidates) {
//           if (fs.existsSync(candidate)) {
//             return {
//               type: 'sourceFile',
//               filePath: candidate,
//             };
//           }
//         }
//       }

//       return context.resolveRequest(context, moduleName, platform);
//     },
//   },
// };

// module.exports = mergeConfig(defaultConfig, config);

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    unstable_enablePackageExports: false,
    unstable_enableSymlinks: true,
    blockList: /syil-backend\/.*/,
  },
};
 
module.exports = mergeConfig(defaultConfig, config);