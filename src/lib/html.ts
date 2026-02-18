const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "br",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "li",
  "ol",
  "p",
  "strong",
  "ul",
  "span",
  "div",
])

const ALLOWED_CLASSNAMES = new Set([
  // LinkedIn / Tailwind-ish classes we want to preserve for spacing/typography.
  "white-space-pre",
  "text-heading-large",
  "mt4",
])

function isSafeHref(href: string): boolean {
  const h = (href || "").trim().toLowerCase()
  return h.startsWith("http://") || h.startsWith("https://")
}

/**
 * Sanitiza HTML "sucio" (p.ej. LinkedIn) para poder renderizarlo con
 * dangerouslySetInnerHTML sin que se vea como texto crudo.
 *
 * Nota: esto NO pretende ser un sanitizer perfecto, pero:
 * - elimina scripts/styles/iframes
 * - elimina atributos peligrosos
 * - limita tags permitidos a un subconjunto de contenido
 */
export function sanitizeRichHtml(inputHtml: string): string {
  const raw = (inputHtml || "").trim()
  if (!raw) return ""
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    // SSR fallback: devolver texto plano (evita inyectar HTML en SSR).
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(raw, "text/html")
  const body = doc.body || doc.querySelector("body")
  if (!body) {
    // Fallback extremo: nunca crashear por HTML malformado.
    const txt = (doc.documentElement?.textContent || "").trim()
    return txt
      ? txt.replace(/\s+/g, " ").trim()
      : raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  }

  const walk = (node: Node) => {
    // Remove comment nodes
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node)
      return
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()
      const originalClassName = (el.getAttribute("class") || "").trim()

      // Drop dangerous containers entirely
      if (tag === "script" || tag === "style" || tag === "iframe" || tag === "object" || tag === "embed") {
        el.parentNode?.removeChild(el)
        return
      }

      // If tag not allowed, unwrap (keep text/children)
      if (!ALLOWED_TAGS.has(tag)) {
        const parent = el.parentNode
        if (!parent) return
        while (el.firstChild) parent.insertBefore(el.firstChild, el)
        parent.removeChild(el)
        return
      }

      // Strip attributes by default
      const attrs = Array.from(el.attributes)
      for (const a of attrs) {
        el.removeAttribute(a.name)
      }

      // Preserve a small allowlist of harmless classnames (needed for spacing in LinkedIn HTML).
      if (originalClassName) {
        const keep = originalClassName
          .split(/\s+/g)
          .map((c) => c.trim())
          .filter((c) => !!c && ALLOWED_CLASSNAMES.has(c))
        if (keep.length > 0) el.setAttribute("class", keep.join(" "))
      }

      // Special-case <a>
      if (tag === "a") {
        const href = (el.getAttribute("href") || "").trim()
        if (!href || !isSafeHref(href)) {
          // Unwrap if href is unsafe
          const parent = el.parentNode
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el)
            parent.removeChild(el)
          }
        } else {
          el.setAttribute("href", href)
          el.setAttribute("target", "_blank")
          el.setAttribute("rel", "noopener noreferrer")
        }
      }

      // If it's a span/div and is empty (or whitespace), remove it.
      const hasKeepClass = (el.getAttribute("class") || "").split(/\s+/g).some((c) => ALLOWED_CLASSNAMES.has(c))
      if ((tag === "span" || tag === "div") && !hasKeepClass && !el.textContent?.trim() && el.children.length === 0) {
        el.parentNode?.removeChild(el)
        return
      }
    }

    // Iterate children (copy list because it mutates)
    const children = Array.from(node.childNodes)
    for (const c of children) walk(c)
  }

  walk(body)
  return (body.innerHTML || "").trim()
}

