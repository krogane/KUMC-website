// Apply the same new-tab behavior to links authored in Markdown.
export function externalLinks() {
  return (tree) => {
    function visit(node) {
      if (node.type === "element" && node.tagName === "a") {
        const href = node.properties?.href;
        if (typeof href === "string" && /^https?:\/\//i.test(href)) {
          const url = new URL(href);
          if (url.origin !== "https://www.kumc-club.net") {
            node.properties.target = "_blank";
            node.properties.rel = ["noopener", "noreferrer"];
          }
        }
      }
      for (const child of node.children || []) visit(child);
    }
    visit(tree);
  };
}
