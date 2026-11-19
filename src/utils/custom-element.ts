/**
 * Drop-in replacement for lit's `@customElement` that skips the define when
 * the tag is already registered.
 *
 * The cards bundle can be loaded twice on one page, e.g. from the copy bundled
 * with the integration (/bambu_lab/...) and from a separate HACS install
 * (/hacsfiles/...). lit's decorator calls `customElements.define`
 * unconditionally, so the second load throws
 * "the name ... has already been used with this registry".
 * See greghesp/ha-bambulab#2158.
 */
export function defineCustomElement(tagName: string, ctor: CustomElementConstructor): void {
  if (customElements.get(tagName)) {
    return;
  }
  customElements.define(tagName, ctor);
}

export const customElement =
  (tagName: string) =>
  <T extends CustomElementConstructor>(classOrTarget: T, context?: ClassDecoratorContext): T => {
    if (context !== undefined) {
      context.addInitializer(() => defineCustomElement(tagName, classOrTarget));
    } else {
      defineCustomElement(tagName, classOrTarget);
    }
    return classOrTarget;
  };
