/*!
 * BIMA DuctDesigner — dealer embed loader
 * ---------------------------------------
 * Usage (dealer website):
 *   <div id="duct-designer"></div>
 *   <script src="https://CONFIGURATOR-DOMAIN/embed.js" data-dealer="dealer-slug" data-height="760"></script>
 *
 * Options (attributes on the script tag):
 *   data-dealer  (required) dealer slug from the admin panel
 *   data-height  (optional) iframe height in px, default 760
 *   data-lang    (optional) reserved for future localisation
 */
;(function () {
  'use strict'

  var script =
    document.currentScript ||
    (function () {
      var all = document.getElementsByTagName('script')
      return all[all.length - 1]
    })()

  if (!script) return

  var dealer = script.getAttribute('data-dealer')
  if (!dealer) {
    console.error('[DuctDesigner] missing data-dealer attribute on the embed script')
    return
  }

  var height = parseInt(script.getAttribute('data-height') || '760', 10)
  var origin = (function () {
    try {
      return new URL(script.src).origin
    } catch (e) {
      return ''
    }
  })()

  if (!origin) {
    console.error('[DuctDesigner] could not determine the configurator origin from the script src')
    return
  }

  function boot() {
    var container = document.getElementById('duct-designer')
    if (!container) {
      container = document.createElement('div')
      container.id = 'duct-designer'
      script.parentNode.insertBefore(container, script)
    }

    // guard against double-embedding
    if (container.getAttribute('data-dd-booted') === '1') return
    container.setAttribute('data-dd-booted', '1')

    var frame = document.createElement('iframe')
    frame.src = origin + '/?embed=1&dealer=' + encodeURIComponent(dealer)
    frame.title = 'Dust extraction configurator'
    frame.loading = 'lazy'
    frame.setAttribute('style', 'width:100%;height:' + height + 'px;border:0;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.1);background:#f8fafc;')
    frame.setAttribute('allow', 'fullscreen')

    // optional height messages from the app
    window.addEventListener('message', function (ev) {
      if (ev.origin !== origin || !ev.data || ev.data.type !== 'dd-height') return
      var h = parseInt(ev.data.height, 10)
      if (h > 400 && h < 3000) frame.style.height = h + 'px'
    })

    container.appendChild(frame)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
