/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'ansi-to-html' {
  interface AnsiToHtmlOptions {
    fg?: string
    bg?: string
    newline?: boolean
    escapeXML?: boolean
    stream?: boolean
    colors?: string[] | Record<number, string>
  }
  class AnsiToHtml {
    constructor(options?: AnsiToHtmlOptions)
    toHtml(input: string): string
  }
  export = AnsiToHtml
}
