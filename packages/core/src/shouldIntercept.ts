export default function shouldIntercept(event: MouseEvent | KeyboardEvent | import('react').MouseEvent<Element>): boolean {
  const isLink = (event.currentTarget as HTMLElement).tagName.toLowerCase() === 'a'
  return !(
    (event.target && (event?.target as HTMLElement).isContentEditable) ||
    event.defaultPrevented ||
    (isLink && 'which' in event && event.which > 1) ||
    (isLink && event.altKey) ||
    (isLink && event.ctrlKey) ||
    (isLink && event.metaKey) ||
    (isLink && event.shiftKey) ||
    (isLink && 'button' in event && event.button !== 0)
  )
}
