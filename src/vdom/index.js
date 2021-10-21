// import createElement from './element.js'
// import diff from './diff.js'
// import patch from './patch.js'

// const oldNode = createElement('div', { class: 'oldClass' }, [
//   createElement('h1', { class: 'old-h1' }, ['old-h1-text']),
//   createElement('ul', { class: 'old-ul' }, [
//     createElement('li', { class: 'old-li' }, ['old-li-11']),
//     createElement('li', { class: 'old-li' }, ['old-li-22'])
//   ])
// ])

// const newNode = createElement('div', { class: 'newClass' }, [
//   createElement('h1', { class: 'new-h1' }, ['new-h1-text']),
//   createElement('h2', { class: 'new-h2' }, ['new-h2-text']),
//   createElement('ul', { class: 'new-ul' }, [
//     createElement('li', { class: 'new-li' }, ['new-li-11']),
//     createElement('li', { class: 'new-li' }, ['new-li-22'])
//   ])
// ])

// const appDom = document.getElementById('app')

// const oldDom = oldNode.render()

// appDom.appendChild(oldDom)

// const patches = diff(oldNode, newNode)

// console.log(JSON.stringify(patches))

// patch(oldDom, patches)

import { htmlVdomParse } from './element.js'
import diff from './diff.js'
import patch from './patch.js'

function vDomToDataDom(vdom, data) {}

const componentInstance = {
  htmlStr: `<div class="view"><p class="msg-content">{{ message }}</p><input :value="message" @input="change" /><button @click="reset">重置</button></div>`,
  data: { message: '123' },
  methods: {
    change: function (value) {
      console.log(value)
      this.dataProxy.message = value
    },
    reset: function (value) {
      console.log('触发重置事件')
      this.dataProxy.message = value
    }
  },
  diffPatch: function (data, pro, value) {
    // if (JSON.stringify(data[pro]) !== JSON.stringify(value)) {
    //   console.log('触发渲染')
    // }
    console.log('触发渲染')
    let cacheData = { ...data }
    const vDom = htmlVdomParse(this.htmlStr, cacheData)
    console.log(vDom)
    cacheData[pro] = value
    const newVdom = htmlVdomParse(this.htmlStr, cacheData)
    console.log(newVdom)
    const patches = diff(vDom, newVdom)
    console.log(patches)
    patch(this.dom, patches)
  }
}

function init(component) {
  component.virtualDom = htmlVdomParse(component.htmlStr)
  console.log(component.virtualDom)
  console.log(component.virtualDom.render())
  component.dataProxy = new Proxy(component.data, {
    set: function (data, prop, value) {
      component.diffPatch(data, prop, value)
      return Reflect.set(data, prop, value)
    }
  })

  if (component.methods) {
    for (const funcName in component.methods) {
      component.methods[funcName] = component.methods[funcName].bind(component)
    }
  }
}

function mounted(component) {
  const app = document.getElementById('app')
  const dom = component.virtualDom.render(component)
  console.log(dom)
  component.dom = dom
  app.appendChild(dom)
}

init(componentInstance)
mounted(componentInstance)

// const vDom = htmlVdomParse(componentInstance.htmlStr)

// console.log(JSON.stringify(vDom))

// const app = document.getElementById('app')

// app.appendChild(vDom.render(componentInstance))

// // console.log(componentInstance)
