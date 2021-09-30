import { patchType } from './vdomType.js'
import { Element } from './element.js'

function diff(oldNode, newNode) {
  const patches = {}
  const levelIndex = { value: 0 }
  dfsWalk(oldNode, newNode, levelIndex, patches)
  return patches
}

function dfsWalk(oldNode, newNode, index, patches) {
  const currentIndex = index.value

  const currentIndexPatches = []

  //   //   新增节点
  //   if (!oldNode && newNode) {
  //     currentIndexPatches.push({ type: patchType.NODE_ADD, value: newNode })
  //   }

  // 删除节点
  if (oldNode && !newNode) {
    currentIndexPatches.push({ type: patchType.NODE_DELETE })
  }

  // 字符串变更
  if (typeof oldNode === 'string' && typeof newNode === 'string') {
    if (oldNode !== newNode) {
      currentIndexPatches.push({ type: patchType.NODE_TEXT_MODIFY, value: newNode })
    }
  }

  //   相同节点变更
  if (Element.isSameNode(oldNode, newNode)) {
    diffProps(oldNode.props, newNode.props, currentIndexPatches)
    diffChildren(oldNode.children, newNode.children, index, currentIndexPatches, patches)
  }

  //   节点替换
  if (Element.isDiffNode(oldNode, newNode)) {
    currentIndexPatches.push({ type: patchType.NODE_REPLACE, value: newNode })
  }

  if (currentIndexPatches.length > 0) {
    patches[currentIndex] = currentIndexPatches
  }
}

function diffChildren(oldChildren, newChildren, index, currentIndexPatches, patches) {
  if (oldChildren.length >= newChildren.length) {
    oldChildren.forEach((child, cIndex) => {
      ++index.value
      dfsWalk(child, newChildren[cIndex], index, patches)
    })
  } else {
    for (let i = oldChildren.length; i < newChildren.length; i++) {
      currentIndexPatches.push({ type: patchType.NODE_ADD, value: newChildren[i] })
    }

    for (let i = 0; i < oldChildren.length; i++) {
      ++index.value
      dfsWalk(oldChildren[i], newChildren[i], index, patches)
    }
  }
}

function diffProps(oldProps, newProps, currentIndexPatches) {
  for (const propKey in oldProps) {
    if (!newProps.hasOwnProperty(propKey)) {
      currentIndexPatches.push({ type: patchType.NODE_ATTRIBUTE_DELETE, key: propKey })
    } else if (newProps[propKey] !== oldProps[propKey]) {
      currentIndexPatches.push({ type: patchType.NODE_ATTRIBUTE_MODIFY, key: propKey, value: newProps[propKey] })
    }
  }

  for (const propKey in newProps) {
    if (!oldProps.hasOwnProperty(propKey)) {
      currentIndexPatches.push({ type: patchType.NODE_ATTRIBUTE_ADD, key: propKey, value: newProps[propKey] })
    }
  }
}

export default diff
