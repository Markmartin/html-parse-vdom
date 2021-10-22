import { htmlVdomParse } from '../parse/html-parse.js'
import diff from './diff.js'
import patch from './patch.js'

const componentInstance = {
  htmlStr: `<div class="view"><p class="msg-content">{{ message }}</p><input :value="message" @input="change" /><button @click="reset">重置</button></div>`,
  data: { message: '123' },
  methods: {
    change: function (value) {
      this.message = value
    },
    reset: function (value) {
      this.message = value
    }
  },
  diffPatch: function (data, pro, value, methods) {
    const patches = diff(
      htmlVdomParse(this.htmlStr, { data, methods }),
      htmlVdomParse(this.htmlStr, { data: { ...data, [pro]: value }, methods })
    )
    // const patches = diff(vDom, newVdom)
    console.log(`patches:${JSON.stringify(patches)}`)
    patch(this.dom, patches)
  }
}

function init(component) {
  component.dataProxy = new Proxy(component.data, {
    set: function (data, prop, value) {
      component.diffPatch(data, prop, value, component.methods)
      return Reflect.set(data, prop, value)
    }
  })

  if (component.methods) {
    for (const funcName in component.methods) {
      component.methods[funcName] = component.methods[funcName].bind(component.dataProxy)
    }
  }

  component.virtualDom = htmlVdomParse(component.htmlStr, { data: component.data, methods: component.methods })
}

function mounted(component) {
  const app = document.getElementById('app')
  component.dom = component.virtualDom.render()
  console.log(component.dom)
  app.appendChild(component.dom)
}

init(componentInstance)
mounted(componentInstance)
