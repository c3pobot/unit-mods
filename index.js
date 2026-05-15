process.on('unhandledRejection', (error) => {
  console.error(`[unhandledRejection] ${error}`)
});
import './src/index.js'
