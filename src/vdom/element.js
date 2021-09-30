class Element {
  constructor(tagName, ...argument) {
    this.tagName = tagName

    const length = argument.length

    if (length === 0) {
      this.props = {}
      this.children = []
      this.key = this.props.key ? this.props.key : null
      return
    }

    if (Array.isArray(argument[0])) {
      this.props = {}
      this.children = argument[0]
      this.key = this.props.key ? this.props.key : null
      return
    }

    if (length === 1) {
      this.props = argument[0] || {}
      this.children = []
    }

    if (length === 2) {
      this.props = argument[0] || {}
      this.children = Array.isArray(argument[1]) ? argument[1] : []
    }

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

  render() {
    const dom = document.createElement(this.tagName)
    for (const propKey in this.props) {
      dom.setAttribute(propKey, this.props[propKey])
    }

    this.children.forEach((child) => {
      const childDom = child instanceof Element ? child.render() : document.createTextNode(child)
      dom.appendChild(childDom)
    })

    return dom
  }
}

function createElement(tagName, ...argument) {
  return new Element(tagName, ...argument)
}

export default createElement
export { Element }
