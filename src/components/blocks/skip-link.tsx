/** First focusable element of every page; jumps to `<main id="contenido">`. */
export function SkipLink() {
  return (
    <a
      href="#contenido"
      data-slot="skip-link"
      className="absolute top-0 left-0 z-100 -translate-y-[120%] rounded-br-md bg-navy px-4 py-3 font-extrabold text-white no-underline transition-transform duration-(--duration-fast) ease-out focus-visible:translate-y-0 focus-visible:text-white"
    >
      Saltar al contenido
    </a>
  );
}
