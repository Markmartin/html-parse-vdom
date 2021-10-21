import { patchType } from './vdomType.js'

function patch(dom, patches) {
  const levelIndex = { value: 0 }
  dfsWalk(dom, levelIndex, patches)
}

function dfsWalk(dom, index, patches, isEnd = false) {
  const currentPatches = patches[index.value]
  if (currentPatches) {
    currentPatches.forEach((patch) => {
      const type = patch.type
      if (type === patchType.NODE_ADD) {
        dom.appendChild(patch.value.render())
        return
      }

      if (type === patchType.NODE_DELETE) {
        dom.remove()
        return
      }

      if (type === patchType.NODE_REPLACE) {
        dom.replaceWith(patch.value.render())
        return
      }

      if (type === patchType.NODE_TEXT_MODIFY) {
        dom.textContent = patch.value
        return
      }

      if (type === patchType.NODE_ATTRIBUTE_ADD || type === patchType.NODE_ATTRIBUTE_MODIFY) {
        if (dom.tagName === 'INPUT' && patch.key === 'value') {
          dom[patch.key] = patch.value
        } else {
          dom.setAttribute(patch.key, patch.value)
        }

        return
      }

      if (type === patchType.NODE_ATTRIBUTE_DELETE) {
        dom.removeAttribute(patch.key, patch.value)
        return
      }
    })
  }

  if (isEnd) {
    return
  }

  const lowestLevel = dom.children.length > 0 ? false : true

  if (!lowestLevel) {
    for (let i = 0; i < dom.children.length; i++) {
      ++index.value
      dfsWalk(dom.children[i], index, patches)
    }
  } else {
    ++index.value
    dfsWalk(dom, index, patches, true)
  }
}

export default patch
