// Central registry of all available tools
// hash must match the route registered in main.js
import { t } from '../i18n/index.js'

export const TOOL_REGISTRY_HASHES = [
  'subnet', 'speedcalc', 'dns', 'ipinfo', 'portref',
  'passgen', 'hashgen',
  'csrgen', 'certgen', 'certchain',
  'intune',
  'portcheck', 'dnsprop', 'speedtest',
  'certdecoder',
  'jsonformat', 'base64', 'timestamp', 'uuidgen', 'regextest', 'textdiff', 'csvclean',
  'bashgen',
]

export function getToolByHash(hash) {
  if (!TOOL_REGISTRY_HASHES.includes(hash)) return null
  return { hash, label: t(`tool.${hash}.label`), desc: t(`tool.${hash}.desc`) }
}

export function getAllTools() {
  return TOOL_REGISTRY_HASHES.map(h => getToolByHash(h))
}

