import { execSync } from 'child_process'
import { resolve } from 'path'

const example = process.argv[2]
const filePath = resolve(__dirname, '../src', example)
execSync(`ts-node ${filePath}`, { stdio: 'inherit' })
