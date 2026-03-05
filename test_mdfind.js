const { exec } = require('child_process');

exec(`mdfind "kMDItemContentType == 'com.apple.xcode.project' || kMDItemContentType == 'com.apple.dt.document.workspace'"`, {maxBuffer: 1024 * 1024 * 50}, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  const lines = stdout.split('\n').filter(l => l.trim().length > 0);
  console.log('Total items:', lines.length);
  console.log(lines.slice(0, 5));
});
