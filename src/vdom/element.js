import { htmlTokenParse } from '../parse/html-parse.js'

const dynamicAttr = /^([:@])([\w]+)$/

const dynamicVariable = /^{{(?:\s*([\w]+)\s*)}}$/

class Element {
  constructor(tagName, ...argument) {
    this.tagName = tagName

    if (Array.isArray(argument[0])) {
      this.props = {}
      this.children = argument[0]
      this.key = this.props.key ? this.props.key : null
      return
    }

    const length = argument.length

    switch (length) {
      case 0:
        {
          this.props = {}
          this.children = []
          this.key = this.props.key ? this.props.key : null
        }
        break
      case 1:
        {
          this.props = argument[0] || {}
          this.children = []
        }
        break
      case 2:
        {
          this.props = argument[0] || {}
          this.children = Array.isArray(argument[1]) ? argument[1] : []
        }
        break
      default:
        break
    }

    // if (length === 0) {
    //   this.props = {}
    //   this.children = []
    //   this.key = this.props.key ? this.props.key : null
    //   return
    // }

    // if (length === 1) {
    //   this.props = argument[0] || {}
    //   this.children = []
    // }

    // if (length === 2) {
    //   this.props = argument[0] || {}
    //   this.children = Array.isArray(argument[1]) ? argument[1] : []
    // }

    this.key = this.props && this.props.key ? this.props.key : null
  }

  static isSameNode(oldNode, newNode) {
    if (oldNode instanceof Element && newNode instanceof Element) {
      return oldNode.tagName === newNode.tagName && oldNode.key === newNode.key
    }

    return false
  }

  static isDiffNode(oldNode, newNode) {
    if (oldNode instanceof Element && newNode instanceof Element) {
      return oldNode.tagName !== newNode.tagName || oldNode.key !== newNode.key
    }

    return false
  }

  render(state = {}) {
    const dom = document.createElement(this.tagName)
    for (const propKey in this.props) {
      switch (propKey) {
        case 'data':
          {
            // 数据监听
            for (const key in this.props[propKey]) {
              const value = state.data ? state.data[this.props[propKey][key]] : this.props[propKey][key]
              dom.setAttribute(key, value)
            }
          }
          break
        case 'event':
          {
            for (const eventName in this.props[propKey]) {
              dom.addEventListener(
                eventName,
                function (e) {
                  if (state.methods) {
                    let func = state.methods[this.props[propKey][eventName]]
                    if (typeof func === 'function') {
                      // func = func.bind(state)
                      func(e.target.value)
                    }
                  }
                }.bind(this)
              )
            }
          }
          break
        default:
          dom.setAttribute(propKey, this.props[propKey])
          break
      }
      // if (propKey === 'data') {
      // // 数据监听
      // for (const key in this.props[propKey]) {
      //   const value = state.data ? state.data[this.props[propKey][key]] : this.props[propKey][key]
      //   console.log(`key:${key}`)
      //   console.log(`value:${value}`)
      // }
      //   continue
      // }
      // if (propKey === 'event') {
      // for (const eventName in this.props[propKey]) {
      //   dom.addEventListener(
      //     eventName,
      //     function (e) {
      //       if (state.methods) {
      //         let func = state.methods[this.props[propKey][eventName]]
      //         if (typeof func === 'function') {
      //           func = func.bind(state)
      //           func(e.target.value)
      //         }
      //       }
      //     }.bind(this)
      //   )
      // }
      //   continue
      // }
      // dom.setAttribute(propKey, this.props[propKey])
    }

    this.children.forEach((child) => {
      let childDom = null
      if (child instanceof Element) {
        childDom = child.render(state)
      }

      if (!(child instanceof Element)) {
        const match = child.match(dynamicVariable)
        if (match) {
          const [_, variable] = match
          if (state.data && state.data[variable]) {
            childDom = document.createTextNode(state.data[variable])
          } else {
            childDom = document.createTextNode(child)
          }
        }
        if (!match) {
          childDom = document.createTextNode(child)
        }
      }

      // const childDom = child instanceof Element ? child.render(state) : document.createTextNode(child)

      if (childDom) {
        dom.appendChild(childDom)
      }
    })

    return dom
  }
}

const htmlVdomParse = function (html, data = null) {
  const elements = []
  let currentvDom = null
  htmlTokenParse(html, {
    start: (tagName, attrs) => {
      let propsMap = {}
      for (let attrKey in attrs) {
        const match = attrKey.match(dynamicAttr)
        if (match) {
          const [_, funcSymbol, funcVariable] = match
          if (funcSymbol === ':') {
            // 监听值变化
            propsMap.data = {
              [funcVariable]: data ? data[attrs[attrKey]] : attrs[attrKey]
            }
          }

          if (funcSymbol === '@') {
            // 监听事件
            propsMap.event = {
              [funcVariable]: attrs[attrKey]
            }
          }
        }

        if (!match) {
          propsMap[attrKey] = attrs[attrKey]
        }
      }

      const vDom = new Element(tagName, propsMap)
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
      if (data) {
        const match = text.match(dynamicVariable)
        if (match) {
          const [_, variable] = match
          currentvDom.children.push(data[variable])
        }
        if (!match) {
          currentvDom.children.push(text)
        }
      }

      if (!data) {
        currentvDom.children.push(text)
      }
    }
  })

  return currentvDom
}

export { htmlVdomParse, Element }
