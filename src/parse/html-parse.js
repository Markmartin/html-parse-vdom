import { Element } from '../vdom/element.js'
// token type define
const tokenType = {
  START_TAG: 'START_TAG',
  END_TAG: 'END_TAG',
  TEXT: 'TEXT'
}
/**
 * match start tag include attritube
 * match group tag-name | attribute-str | endline separate /
 */

const startTag =
  /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:@][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/

/**
 * match end tag
 */
const endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/

/**
 * match attribute str
 * match group attribut-name | attribute-value
 */
const allAttr = /([a-zA-Z_:@][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g

const attr = /([a-zA-Z_:@][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/

String.prototype.matchStart = function (str) {
  return this.indexOf(str) === 0 ? true : false
}

Array.prototype.last = function () {
  return this.length === 0 ? {} : this[this.length - 1]
}

// tokenizer
const htmlTokenParse = function (html, handler = {}) {
  let chars = false
  let match = null
  let stack = []

  while (html) {
    if (!html) break

    chars = true
    //  match html start tag
    if (html.matchStart('<')) {
      match = html.match(startTag)
      if (match) {
        const [matchStr, tagStr, attrStr] = match
        html = html.substring(matchStr.length)

        const token = { type: tokenType.START_TAG, tag: tagStr.toLowerCase(), attrsMap: {} }
        if (!!attrStr) {
          const attrArr = attrStr.match(allAttr)
          if (attrArr.length > 0) {
            attrArr.forEach((str) => {
              const attrMatch = str.match(attr)
              if (attrMatch) {
                const [_, attrName, attrValue = null] = attrMatch
                token.attrsMap[attrName] = attrValue
              }
            })
          }
        }
        stack.push(token)
        if (handler.start) {
          handler.start(stack.last().tag, stack.last().attrsMap)
        }

        // self-close-tag
        if (match.last() === '/') {
          stack.push({ type: tokenType.END_TAG, tag: tagStr.toLowerCase() })
          if (handler.end) {
            handler.end(stack.last().tag)
          }
        }

        chars = false
        continue
      }
    }

    // match html end tag
    if (html.matchStart('</')) {
      match = html.match(endTag)
      if (match) {
        const [matchStr, tagStr] = match
        html = html.substring(matchStr.length)
        stack.push({ type: tokenType.END_TAG, tag: tagStr.toLowerCase() })
        if (handler.end) {
          handler.end(stack.last().tag)
        }
        chars = false
        continue
      }
    }

    // pure char
    if (chars) {
      const index = html.indexOf('<')
      const text = index < 0 ? html : html.substring(0, index)
      html = index < 0 ? null : html.substring(index)
      stack.push({ type: tokenType.TEXT, content: text })
      if (handler.chars) {
        handler.chars(stack.last().content)
      }
    }
  }

  return stack
}

// ast parse
const htmlASTParse = function (tokens) {
  // match root level
  function matchRoot(tagToken, tokens = []) {
    const tokenArr = []
    let match = { matchIndex: -1, root: false }

    if (!tokens || tokens.length === 0) {
      return match
    }

    tokens.forEach((token, index) => {
      if (token.type === tagToken.type && token.tag === tagToken.tag) {
        tokenArr.push(token)
        return
      }

      if (token.type === tokenType.END_TAG && tagToken.tag === token.tag) {
        if (tokenArr.length > 0) {
          tokenArr.pop()
          return
        }

        if (tokenArr.length === 0) {
          match = { matchIndex: index, root: index === tokens.length - 1 ? true : false }
          return
        }
      }
    })

    return match
  }

  const domTree = []
  // 空树
  if (!tokens || tokens.length === 0) {
    return domTree
  }

  const firstToken = tokens[0]

  if (firstToken.type === tokenType.TEXT) {
    domTree.push(firstToken)
  }

  const { matchIndex, root } = matchRoot(firstToken, tokens.slice(1))
  if (root) {
    domTree.push({
      ...firstToken,
      children: htmlASTParse(tokens.slice(1, tokens.length - 1))
    })
  }

  if (!root) {
    // collect tag pairs
    const tagPairs = []
    tokens.forEach((token, index) => {
      if (token.type === tokenType.START_TAG) {
        if (!tagPairs.last().type || tagPairs.last().type === tokenType.END_TAG) {
          tagPairs.push({ ...token, index })
        }
      }

      if (token.type === tokenType.END_TAG) {
        if (tagPairs.last().type === tokenType.START_TAG && tagPairs.last().tag === token.tag) {
          tagPairs.push({ ...token, index })
        }
      }
    })

    // generate children dom by tag pairs
    tagPairs.forEach((token, index) => {
      if (token.type === tokenType.START_TAG) {
        const newTokens = tokens.slice(token.index + 1, tagPairs[index + 1].index)
        domTree.push({ ...token, children: htmlASTParse(tokens.slice(token.index + 1, tagPairs[index + 1].index)) })
      }
    })
  }

  return domTree
}

const htmlDomParse = function (html, mountedDom) {
  const elements = []
  let currentDom = mountedDom || document.body
  htmlTokenParse(html, {
    start: (tagName, attrs) => {
      const dom = document.createElement(tagName)
      for (const key in attrs) {
        dom.setAttribute(key, attrs[key])
      }
      elements.push(dom)
      currentDom.appendChild(dom)
      currentDom = dom
    },
    end: (tagName) => {
      elements.length -= 1
      currentDom = elements[elements.length - 1]
    },
    chars: (text) => {
      const textDom = document.createTextNode(text)
      currentDom.appendChild(textDom)
    }
  })

  return mountedDom || document.body
}

const htmlVdomParse = function (html) {
  const elements = []
  let currentvDom = null
  htmlTokenParse(html, {
    start: (tagName, attrs) => {
      const vDom = new Element(tagName, attrs)

      elements.push(vDom)

      if (!currentvDom) {
        currentvDom = vDom
        return
      }

      if (currentvDom) {
        currentvDom.children.push(vDom)
        currentvDom = vDom
        return
      }
    },
    end: (tagName) => {
      elements.length -= 1
      if (elements.length > 0) {
        currentvDom = elements[elements.length - 1]
      }
    },
    chars: (text) => {
      currentvDom.children.push(text)
    }
  })

  return currentvDom
}

export { htmlTokenParse, htmlASTParse, htmlDomParse, htmlVdomParse }

// const simpleHtmlStr = `<div class="root" @click="clickEvent"><div class="child-1"><img class="child-1-1" src="xxxx" alt="xxx" /><p class="child-1-2">666</p></div><div class="child-2"><span class="child-2-1">span666</span><p class="child-2-2">p6666</p></div></div>`

// const htmlTokens = htmlTokenParse(simpleHtmlStr)

// console.log(htmlTokens)

// const ast = htmlASTParse(htmlTokens)

// console.log(ast)
