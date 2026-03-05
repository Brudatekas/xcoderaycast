import { execSync } from 'child_process'; console.log(execSync('find ~/macosprojs -maxdepth 3 -type d -name "*.xcodeproj" -o -name "*.xcworkspace"').toString());
