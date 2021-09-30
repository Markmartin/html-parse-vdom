import createElement from './element.js'
import diff from './diff.js'
import patch from './patch.js'

const oldNode = createElement('div', { class: 'oldClass' }, [
  createElement('h1', { class: 'old-h1' }, ['old-h1-text']),
  createElement('ul', { class: 'old-ul' }, [
    createElement('li', { class: 'old-li' }, ['old-li-11']),
    createElement('li', { class: 'old-li' }, ['old-li-22'])
  ])
])

const newNode = createElement('div', { class: 'newClass' }, [
  createElement('h1', { class: 'new-h1' }, ['new-h1-text']),
  createElement('h2', { class: 'new-h2' }, ['new-h2-text']),
  createElement('ul', { class: 'new-ul' }, [
    createElement('li', { class: 'new-li' }, ['new-li-11']),
    createElement('li', { class: 'new-li' }, ['new-li-22'])
  ])
])

const appDom = document.getElementById('app')

const oldDom = oldNode.render()

appDom.appendChild(oldDom)

const patches = diff(oldNode, newNode)

console.log(JSON.stringify(patches))

patch(oldDom, patches)
