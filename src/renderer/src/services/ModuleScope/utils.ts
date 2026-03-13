import { ModuleNode, ModuleNodeInput } from './type'

export function buildModuleTree(nodes: ModuleNodeInput[], parentCode = ''): ModuleNode[] {
  return nodes.map((node) => {
    const fullCode = parentCode ? `${parentCode}.${node.code}` : node.code

    return {
      code: fullCode,
      ...(node.children && {
        children: buildModuleTree(node.children, fullCode)
      })
    }
  })
}
