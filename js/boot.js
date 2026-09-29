/* Runs before first paint: flags that JS is available so the CSS can switch
   to the enhanced layout (e.g. the collapsible mobile nav) without a flash.
   Kept as a file rather than inline so the CSP can forbid inline scripts. */
document.documentElement.classList.add("js");
