import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'contracts/block-registry.json');
const modulesPath = path.join(root, 'contracts/settings-modules.json');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const registry = readJson(registryPath);
const modules = readJson(modulesPath);
const errors = [];
const knownCategories = new Set(registry.categories);
const knownModules = new Set(Object.keys(modules.modules));
const blocks = new Map();

function readLiquidSchema(file) {
  const source = fs.readFileSync(file, 'utf8');
  const match = source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
  if (!match) throw new Error(`missing schema tag: ${path.relative(root, file)}`);
  return JSON.parse(match[1]);
}

for (const block of registry.blocks) {
  if (blocks.has(block.type)) errors.push(`duplicate block type: ${block.type}`);
  blocks.set(block.type, block);
  if (!knownCategories.has(block.category)) errors.push(`${block.type}: unknown category ${block.category}`);
  if (!Array.isArray(block.capabilities)) errors.push(`${block.type}: capabilities must be an array`);
  for (const moduleName of block.settings_modules ?? []) {
    if (!knownModules.has(moduleName)) errors.push(`${block.type}: unknown settings module ${moduleName}`);
    if (!block.capabilities?.includes(moduleName)) errors.push(`${block.type}: module ${moduleName} is not listed as a capability`);
  }
  if (!block.owners?.data_owner || !block.owners?.state_owner || !block.owners?.layout_owner || !block.owners?.motion_owner) {
    errors.push(`${block.type}: ownership must define data_owner, state_owner, layout_owner and motion_owner`);
  }
  if (!block.rendering?.root_class || !block.rendering?.path || !block.rendering?.render_mode) {
    errors.push(`${block.type}: rendering must define root_class, path and render_mode`);
  }
  if (block.status === 'implemented') {
    const implementationPath = path.join(root, block.rendering.path);
    if (!fs.existsSync(implementationPath)) {
      errors.push(`${block.type}: implementation file does not exist: ${block.rendering.path}`);
    } else {
      try {
        const schema = readLiquidSchema(implementationPath);
        const actualSettings = new Set((schema.settings ?? []).map((setting) => setting.id).filter(Boolean));
        const mappedSettings = new Set(Object.keys(block.schema_contract?.settings ?? {}));
        if (!block.schema_contract?.settings) errors.push(`${block.type}: missing schema_contract.settings`);
        for (const id of actualSettings) {
          if (!mappedSettings.has(id)) errors.push(`${block.type}: schema setting is not mapped in Registry: ${id}`);
        }
        for (const id of mappedSettings) {
          if (!actualSettings.has(id)) errors.push(`${block.type}: Registry maps missing schema setting: ${id}`);
        }
        const actualChildren = (schema.blocks ?? []).map((child) => child.type);
        const allowedChildren = block.children === false ? [] : (block.children?.allowed_children ?? []);
        if (JSON.stringify(actualChildren) !== JSON.stringify(allowedChildren)) {
          errors.push(`${block.type}: schema children do not match Registry allow-list`);
        }
      } catch (error) {
        errors.push(`${block.type}: invalid Liquid schema: ${error.message}`);
      }
    }
  }
  const settingIds = new Set();
  for (const setting of block.block_specific_settings ?? []) {
    if (settingIds.has(setting.id)) errors.push(`${block.type}: duplicate setting id ${setting.id}`);
    settingIds.add(setting.id);
    for (const field of ['type', 'default', 'value_mapping', 'constraints']) {
      if (!(field in setting)) errors.push(`${block.type}.${setting.id}: missing ${field}`);
    }
  }
  if (block.children === false) continue;
  if (!block.children?.allowed_children) errors.push(`${block.type}: children must be false or define allowed_children`);
}

const visiting = new Set();
const visited = new Set();
function visit(type, trail = []) {
  if (visiting.has(type)) {
    errors.push(`recursive nesting: ${[...trail, type].join(' -> ')}`);
    return;
  }
  if (visited.has(type)) return;
  visiting.add(type);
  const block = blocks.get(type);
  for (const child of block?.children?.allowed_children ?? []) {
    if (!blocks.has(child)) errors.push(`${type}: unknown allowed child ${child}`);
    else visit(child, [...trail, type]);
  }
  visiting.delete(type);
  visited.add(type);
}
for (const type of blocks.keys()) visit(type);

for (const [moduleName, module] of Object.entries(modules.modules)) {
  const ids = new Set();
  for (const setting of module.settings ?? []) {
    if (ids.has(setting.id)) errors.push(`settings module ${moduleName}: duplicate setting id ${setting.id}`);
    ids.add(setting.id);
    for (const field of ['type', 'default', 'value_mapping', 'constraints']) {
      if (!(field in setting)) errors.push(`settings module ${moduleName}.${setting.id}: missing ${field}`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Block Registry valid: ${registry.blocks.length} blocks, ${knownModules.size} settings modules.`);
