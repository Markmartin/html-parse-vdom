import { htmlTokenParse, htmlASTParse, htmlDomParse, htmlVdomParse } from '../parse/html-parse.js'

const htmlStr = `<div class="view"><p class="msg-content">{{ message }}</p><input :value="message" /></div>`

const tokens = htmlTokenParse(htmlStr)

console.log(tokens)

const app = document.getElementById('app')

htmlDomParse(htmlStr, app)

console.log(app)

const vdom = htmlVdomParse(htmlStr)

console.log(vdom)
